


# Methodology / Usage
This script, loads the Linked profile of the user and gives some ranking based on linked in profile.
The weightage is calculated on four contents from linked in profile
1. profile pic
2. Recent job title
3. Number of Positions held and recorded in linked in
4. Number of connections
5. Number of Recommendations received.

### Weightages for signals

| Signal name | Weightage Value | comments |
| - | - | - |
| profile picture | 10 | If user has a profile picture 10 points given |
| Recent Job title | 10  | If recent primary job title has key word matching email domain , then 10 points given |
| Number of Positions held and recorded in linked in | 5 | For each position reported 5 points given |
| Number of connections | 10  |  For Every 50 connections, 10 points given |
| Number of Recommendations received | 10 | For every recommendation recievd , 10 points given |

Total Weightage is calculated by sum of all the above weightage.

We can define a threshold, from above weightage, to ensure, if a profile is valid one or not.



# How to use
1. In the root directory, change the content of input.txt. Copy the email id and linkedin url from google sheet in here.
2. Start the app with the command
``` linkedinUserName=<<<YOUR_TEST_LINKED_IN_USER>>> linkedinPassword=<<<YOUR_TEST_LINKED_IN_PASS>>> node index.js ```
3. Check the output in output.txt


##  Logging

All the logs are written in the root of the project with the name `pino-logger.log`