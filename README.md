# Multiplayer quiz app built on Salesforce technology (player app)

ℹ️ Please refer to the [quiz host app](https://github.com/forcedotcom/quiz-host-app) for documentation.

## Heroku deploy (recommended)

Click on this button and follow the instructions to deploy the app:

<p align="center">
  <a href="https://www.heroku.com/deploy?template=https://github.com/forcedotcom/quiz-player-app">
    <img src="https://www.herokucdn.com/deploy/button.svg" alt="Deploy">
  </a>
<p>

## Local setup (development only)

Create a `.env` file at the root of the project:

```properties
SF_LOGIN_URL='https://test.salesforce.com'
SF_API_VERSION='55.0'
SF_USERNAME='YOUR_SALESFORCE_USERNAME'
SF_PASSWORD='YOUR_SALESFORCE_PASSWORD'
SF_TOKEN='YOUR_SALESFORCE_SECURITY_TOKEN'
SF_NAMESPACE=''
QUIZ_API_KEY='YOUR_QUIZ_API_KEY'
COLLECT_PLAYER_EMAILS=false
```

Run the project with `npm start`
