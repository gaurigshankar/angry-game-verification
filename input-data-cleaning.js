const fs = require('fs')

const readFileAndGetData = () => {
    try {
        const data = fs.readFileSync('./input.txt', 'utf8')
        console.log(data)
        let target = {};
        data.split('\n').forEach((pair) => {
          if(pair !== '') {
            let splitpair = pair.split('\t');
            let key = splitpair[0].charAt(0).toLowerCase() + splitpair[0].slice(1).split(' ').join('');
            target[key] = splitpair[1];
            let emailDomainRegex = /.*@(?<EMAIL_DOMAIN>.*)\.com/;
          }
        });
        return target;
      } catch (err) {
        console.error(err)
      }
}
readFileAndGetData() 

module.exports = {
    readFileAndGetData
}