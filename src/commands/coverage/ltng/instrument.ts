import {core, flags, SfdxCommand} from '@salesforce/command';
import * as fs from 'fs';
import * as globby from 'globby';
import * as istanbul from 'istanbul-lib-instrument';
import {dirname} from 'path';
import * as mkdirp from 'mkdirp';
import * as xml from 'xml';
import * as crypto from 'crypto';

// TODO: handle static resources

// Initialize Messages with the current plugin directory
core.Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = core.Messages.loadMessages('sfdx-coverage', 'instrument');

export default class Instrument extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  public static examples = [
  `$ sfdx hello:org --targetusername myOrg@example.com --targetdevhubusername devhub@org.com
  Hello world! This is org: MyOrg and I will be around until Tue Mar 20 2018!
  My hub org id is: 00Dxx000000001234
  `,
  `$ sfdx hello:org --name myname --targetusername myOrg@example.com
  Hello myname! This is org: MyOrg and I will be around until Tue Mar 20 2018!
  `
  ];

  public static args = [{name: 'file'}];

  protected static flagsConfig = {
    // flag with a value (-n, --name=VALUE)
    // TODO: allow instrumenting specific files
    // files: flags.string({char: 'f', description: messages.getMessage('filesFlagDescription')}),
    rootdir: flags.string({char: 'r', required: true, description: messages.getMessage('rootdirFlagDescription')}),
    outputdir: flags.string({char: 'd', required: true, description: messages.getMessage('outputFlagDescription')})
  };

  // Comment this out if your command does not require an org username
  protected static requiresUsername = true;

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = false;

  public async run(): Promise<core.AnyJson> {
    const paths = await globby([process.cwd() + '/' + this.flags.rootdir+'/**/aura/*/*']);
    
    let options = {instrumenterConfig: {
      coverageVariable: '__coverage__',
      compact: true,
      preserveComments: false,
      produceSourceMap: true
    }};
    // process each file, instrumenting as needed
    let bundles = []
    for(var file of paths){
      // TODO: if this is a bundle, add it to the list of bundles to add to package.xml
      var bName = this.getBundleName(file);
      if(bName){
        bundles.push(bName);
      }
      this.processFile(options, file);
    }

    this.buildPackageXML(options, bundles);

    return;
  }

  public getBundleName(filename){
    if(/\w+\.\w+-meta.xml$/.test(filename)){
      var match = /(\w+)\.\w+-meta.xml/.exec(filename);
      return match[1];
    }
    return null;
  }

  public buildPackageXML(options, bundles){
    // Build object that will be transmuted into XML
    let p = [];
    p.push({_attr: {xmlns:"http://soap.sforce.com/2006/04/metadata"}});
    p.push({version: '43.0'}); // TODO: get API version from project file
    let types = {};
    // for now we have to override the lts_testutil installed by the Lighting Testing Service package
    // This is to capture the __coverage__ variable from the window into the DOM
    this.deployLTSOverride(options);
    types['StaticResource'] = ['lts_testutil'];

    types['AuraDefinitionBundle'] = bundles;
    let typeOut = this.buildTypes(types);
    p = p.concat(typeOut);
    let x = xml({'Package':p}, { declaration: true, indent: '  ' });
    this.writeData(options, x, this.flags.outputdir + '/package.xml');
  }

  public deployLTSOverride(options){
    // read in files
    // TODO: make this less clunky
    let self = this;
    
    fs.readFile(__dirname+'/../../../../src/lib/lts_override/lts_testutil.resource-meta.xml', 'utf8', function (err,data) {
      if(err){
        console.log('ERROR:', err);
      } else {
        self.writeData(options, data, self.flags.outputdir+'/staticresources/lts_testutil.resource-meta.xml');
      }
    });
    
    fs.readFile(__dirname+'/../../../../src/lib/lts_override/lts_testutil.resource', 'utf8', function (err,data) {
      if(err){
        console.log('ERROR:', err);
      } else {
        self.writeData(options, data, self.flags.outputdir+'/staticresources/lts_testutil.resource');
      }
    });
  }

  public buildTypes(types){
    let typesOut = [];
    for(var t in types){
      let typeOut = [];
      typeOut.push({name:t});
      for(var b of types[t]){
        typeOut.push({members:b});
      }
      typesOut.push({types:typeOut});
    }
    return typesOut;
  }

  public processFile(options, filename){
    let self = this;
    fs.readFile(filename, 'utf8', function (err,data) {
      if (err) {
        return console.log(err);
      }
      if(self.shouldInstrument(filename)){
        data = self.transform(options, data, filename);
      }
      self.writeCompletedFile(options, data, filename);

    });
  }

  public shouldInstrument(file){
    return file.endsWith('.js');
  }

  public writeCompletedFile(options, data, filename){
    let pos = filename.indexOf('aura')-1; // capture directory separator
    var newFilename = filename.substr(pos);
    newFilename = this.flags.outputdir + newFilename;
    
    // rewrite filename for writing to base directory
    this.writeData(options, data, newFilename);
  }

  public writeData(options, data, filename){
    // Need to ensure path existing leading up to file
    mkdirp(dirname(filename), function (err) {
      fs.writeFile(filename, data, 'utf8', (err) => {
          if (err) {
              if (err.code === 'EEXIST') {
                console.error('myfile already exists');
                return;
              }
              throw err;
            }
      });
      
    });
  }

  public transform(options, data, filename): any {
    let instrumenter = istanbul.createInstrumenter(options.instrumenterConfig);

    let code = instrumenter.instrumentSync(data, filename);
    // take instrumented code and make it lighting compatible
    let coverageInfo = {};
    coverageInfo[filename] = instrumenter.lastFileCoverage();
    let coverageFilename = '.nyc_output/'+crypto.createHash('md5').update(filename).digest('hex')+'.json';
    this.writeData(options, JSON.stringify(coverageInfo), coverageFilename);
    return this.processForLightning(code);
  }

  public processForLightning(data){
      // find ending location of header info
      // to be lightning compatible we must keep the enclosing module syntax
      // to ensure instrumentation succeeds we copy the setup portion into the top
      // of each mothod.
      let setupEndPos = data.indexOf(".s[0]++;")+8;
      // once we have the header character scope
      // extract it out to a variable
      let setupInfo = data.substring(0,setupEndPos);
      data = data.substring(setupEndPos);
      
      // replace method used to find master scope with explicit attachment to window
      setupInfo = setupInfo.replace("new Function('return this')()", "window");
      // place setupInfo into the instrumented javascript for each function just prior to each function logging it was called
      // results in a lot of repeated setup commands but I can't think of another way to ensure it is called
      return data.replace(/(cov_\w+.f\[\d+\]\+\+;)/g, setupInfo+"\n$1");
      // overwrite the file with the changes
  }
}
