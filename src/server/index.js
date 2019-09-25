const express = require('express'),
    jsforce = require('jsforce'),
    WebSocketService = require('./utils/webSocketService.js'),
    QuizSessionRestResource = require('./rest/quiz-session.js'),
    PlayerRestResource = require('./rest/player.js'),
    AnswerRestResource = require('./rest/answer.js');

// Load and check config
require('dotenv').config();
const { SF_USERNAME, SF_PASSWORD, SF_TOKEN, SF_LOGIN_URL } = process.env;
if (!(SF_USERNAME && SF_PASSWORD && SF_TOKEN && SF_LOGIN_URL)) {
    console.error(
        'Cannot start app: missing mandatory configuration. Check your .env file.'
    );
    process.exit(-1);
}

module.exports = app => {
    app.use(express.json());

    // Connect WebSocket
    const wss = new WebSocketService();
    wss.connect();

    // Connect to Salesforce
    const sfdc = new jsforce.Connection({
        loginUrl: SF_LOGIN_URL
    });
    sfdc.login(SF_USERNAME, SF_PASSWORD + SF_TOKEN, err => {
        if (err) {
            console.error(err);
            process.exit(-1);
        }
    }).then(() => {
        console.log('Connected to Salesforce');
        // Subscribe to Change Data Capture on Quiz Session record
        sfdc.streaming
            .topic('/data/Quiz_Session__ChangeEvent')
            .subscribe(event => {
                const { Phase__c } = event.payload;
                // Reformat message and send it to client via WebSocket
                const message = {
                    type: 'phaseChangeEvent',
                    data: {
                        Phase__c
                    }
                };
                wss.broadcast(JSON.stringify(message));
            });
    });

    // Setup Quiz Session REST resources
    const quizSessionRest = new QuizSessionRestResource(sfdc);
    app.get('/api/quiz-sessions', (request, response) => {
        quizSessionRest.getSession(request, response);
    });

    // Setup Players REST resources
    const playerRest = new PlayerRestResource(sfdc);
    app.get('/api/players', (request, response) => {
        playerRest.isNicknameAvailable(request, response);
    });
    app.post('/api/players', (request, response) => {
        playerRest.registerPlayer(request, response);
    });
    app.get('/api/score', (request, response) => {
        playerRest.getScoreAndRanking(request, response);
    });

    // Setup Answer REST resources
    const answerRest = new AnswerRestResource(sfdc);
    app.post('/api/answers', (request, response) => {
        answerRest.submitAnswer(request, response);
    });
};
