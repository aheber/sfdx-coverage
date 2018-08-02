import {core, flags, SfdxCommand} from '@salesforce/command';
import * as alm from 'salesforce-alm';
import {dirname} from 'path';
import * as mkdirp from 'mkdirp';
import * as fs from 'fs';

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
appname: flags.string({char: 'a', description: messages.getMessage('appNameFlagDescription')}),
// rootdir: flags.string({char: 'r', required: true, description: messages.getMessage('rootdirFlagDescription')}),
// outputdir: flags.string({char: 'd', required: true, description: messages.getMessage('outputFlagDescription')})
};

// Comment this out if your command does not require an org username
protected static requiresUsername = true;

// Set this to true if your command requires a project workspace; 'requiresProject' is false by default
protected static requiresProject = true;

public async run(): Promise<core.AnyJson> {
    await this.deployTestAPIOverwrite();
    return;
}

public async deployTestAPIOverwrite(){
    
    let self = this;
    
    fs.readFile(__dirname+'/../../../../src/lib/salesforce-almoverride/lightningTestAPI.js', 'utf8', async function (err,data) {
      if(err){
        console.log('ERROR:', err);
      } else {
        await self.writeData(data, __dirname+'/../../../../node_modules/salesforce-alm/dist/lib/lightning/lightningTestApi.js');
        const sfdx = self._processALM();
        await sfdx.lightning.test.run({appname: self.flags.appname});
      }
    });
}



public writeData(data, filename){
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

public _processALM(): any{
    const sfdx = {};
    let self = this;
    alm.commands.forEach(function(c){
        if(c.command === undefined){
            return;
        }
        // build the topic if it doesn't already exist
        if(!sfdx.hasOwnProperty(c.topic)){
            sfdx[c.topic] = {};
        }
        // start dynamic traversal to build command sequence
        var top = sfdx[c.topic];
        c.command.split(':').forEach(function(level, idx, array){
            // If last element then attach RUN function
            if (idx === array.length - 1){ 
                top[level] = self._createCommand(c.run);
                return;
            }

            // if we don't have this command at this depth yet
            if(!top.hasOwnProperty(level)){
                top[level] = {};
            }
            // move context deeper
            top = top[level];
        });
    });

    return sfdx;
}

public _createCommand(fn){
    return function(flags, opts){
        var ctx = opts || {};
        ctx.flags = flags || {};
        return fn(ctx);
    }
}
}
