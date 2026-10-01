import {execFileSync} from 'node:child_process';
import {writeFileSync,readFileSync,mkdirSync,existsSync} from 'node:fs';
const paths=execFileSync('git',['ls-files','--cached','--others','--exclude-standard'],{encoding:'utf8'}).trim().split('\n').filter(p=>p&&!p.startsWith('public/source-')&&existsSync(p));
const files=paths.map(path=>({path,content:readFileSync(path,'utf8')}));
mkdirSync('public',{recursive:true});writeFileSync('public/source-files.json',JSON.stringify({format:'complete-project-source-snapshot',note:'Generated source-files.json and source-project.zip are reproducible build outputs, excluded from Git.',files}));
execFileSync('python3',['-c',`import zipfile,sys\nwith zipfile.ZipFile('public/source-project.zip','w',zipfile.ZIP_DEFLATED) as z:\n for p in sys.argv[1:]: z.write(p,p)`,...paths]);
console.log('Source snapshot prepared: '+paths.length+' files');
