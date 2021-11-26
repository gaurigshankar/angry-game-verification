const puppeteer = require('puppeteer');
require('dotenv').config();
const pino = require('pino');
let logger;
const { readFileAndGetData } = require('./input-data-cleaning');


(async () => {
 try {
    logger = new pino(
        {
            prettyPrint: {
              colorize: true,
              levelFirst: true,
              translateTime: "yyyy-dd-mm, h:MM:ss TT",
            },
          },
          pino.destination("./pino-logger.log")
    );
    const userData = readFileAndGetData();
    console.log(userData);
    logger.info("Starting the process")

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox']
        //,devtools: true
     });
     const { linkedinUserName , linkedinPassword } = process.env;
      const page = await browser.newPage();
      await page.goto('https://www.linkedin.com/uas/login');
    
      const USERNAME_SELECTOR ="#username";
      const PASSWORD_SELECTOR = "#password";
      const SIGN_IN_SELECTOR = "button.btn__primary--large";
      await page.click(USERNAME_SELECTOR);
      await page.keyboard.type(linkedinUserName);
      await page.waitForTimeout(3*1000);
      await page.click(PASSWORD_SELECTOR);
      await page.keyboard.type(linkedinPassword);
      await page.waitForTimeout(3*1000);
      await page.click(SIGN_IN_SELECTOR);
      await page.waitForTimeout(10*1000);
      await page.waitForSelector('.global-nav__branding');
      logger.info("Logged in")
      
      const data = [{
        id: "pgaurishankar",
        eDomain: "walmart"
      },{
        id: "veerareddy-chitla",
        eDomain: "gmail"
      },
      {
          id: "saai-krishnan-udayakumar",
          eDomain: "salesforce"
      },
      {
          id: "raghav-atluri-134243226",
          eDomain: "gmail"
      }
    ];
    let snapshotCollection = [];
      for (let datum of data) {
        const { id, eDomain } = datum;
        const profileTab = await browser.newPage();
        await profileTab.goto(`https://www.linkedin.com/in/${id}`);
        await profileTab.waitForTimeout(10*1000);
        await autoScroll(profileTab);
        await profileTab.waitForTimeout(10*1000);
        const snapshot = await profileTab.evaluate(() => {
            //profile-photo-edit__preview 
            const profilePic = document.querySelector("img.pv-top-card-profile-picture__image").src;
            const numberOfConnection = document.querySelector("li.text-body-small").innerText;
            const numberOfRecommendationReceived = document.querySelector("button.artdeco-tab").innerText;
            const recentJobTitle = document.querySelector("div.text-body-medium.break-words").innerText;
            const numberOfPositions = document.querySelectorAll("li.pv-entity__position-group-pager").length;
            const snapshot = {
                profilePic,
                numberOfConnection,
                numberOfRecommendationReceived,
                recentJobTitle,
                numberOfPositions
            }
            return snapshot;

        });
        snapshotCollection.push({id, snapshot: cleanupDatum(snapshot, eDomain)});
        
      }
      logger.info(snapshotCollection)
      await browser.close();
 } catch (error) {
     console.error(error)
 }
})();

const weightageMapping = {
    isDefaultProfilePic: 10,
    connectionsCount: 10,
    recommendationCount: 10,
    numberOfPositions: 5,
    matchingEmailDomain: 10
}

const cleanupDatum = (datum, eDomain) => {
    const { profilePic, numberOfConnection, numberOfRecommendationReceived, recentJobTitle, numberOfPositions } = datum;
    const isDefaultProfilePic = profilePic && profilePic.includes("data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7");
    const connectionsCountString = numberOfConnection && numberOfConnection.split(" ")[0];
    const connectionsCount = connectionsCountString && connectionsCountString.includes("+") && connectionsCountString.split("+")[0] || connectionsCountString;
    const recommendationCountRegex = /Received\s\((?<NUMBER_CONN>\d+)\)/gi;
    const { groups: { NUMBER_CONN = 0 } }= recommendationCountRegex.exec(numberOfRecommendationReceived.trim());
    const recommendationCount = NUMBER_CONN;

    const profileSnapshot = {
        isDefaultProfilePic,
        connectionsCount,
        recommendationCount,
        recentJobTitle,
        numberOfPositions,
        isRecentJobMatchingEmailDomain:  checkIfEmailDomainIsRelatedToRecentPosition(recentJobTitle, eDomain )
    }

    return {
        ranking: computeRanking(profileSnapshot),
        ...profileSnapshot,
        
    }
}

const computeRanking = ({
    isDefaultProfilePic,
    connectionsCount,
    recommendationCount,
    numberOfPositions,
    isRecentJobMatchingEmailDomain
}
) => {
    const profileWeightage = isDefaultProfilePic ? 0 : weightageMapping.isDefaultProfilePic;
    const connectionWeightage = (parseInt(connectionsCount)/50) * weightageMapping.connectionsCount;
    const recommendationCountWeightage = parseInt(recommendationCount) * weightageMapping.recommendationCount;
    const numberOfPositionsWeightage = numberOfPositions * weightageMapping.numberOfPositions;
    const jobMatchingEmailDomainWeightage = isRecentJobMatchingEmailDomain ? weightageMapping.matchingEmailDomain : 0;
    const totalWeightage = profileWeightage + connectionWeightage + recommendationCountWeightage + 
        numberOfPositionsWeightage + jobMatchingEmailDomainWeightage;
    return totalWeightage;
}

const checkIfEmailDomainIsRelatedToRecentPosition = (recentJobTitle = "", eDomain) => {
    return recentJobTitle.toLowerCase().includes(eDomain.toLowerCase());
}

async function autoScroll(page){
    await page.evaluate(async () => {
        await new Promise((resolve, reject) => {
            var totalHeight = 0;
            var distance = 100;
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if(totalHeight >= scrollHeight){
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}