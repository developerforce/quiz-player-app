/* eslint-disable no-console */
import { LightningElement, track, wire } from 'lwc';

import { getErrorMessage } from 'utils/error';
import { getCookie, setCookie, clearAllCookies } from 'utils/cookies';
import { WebSocketClient } from 'utils/webSocketClient';

import { PHASES, getCurrentSession } from 'services/session';
import { getPlayerLeaderboard } from 'services/player';
import { submitAnswer } from 'services/answer';

const COOKIE_PLAYER_NICKNAME = 'nickname';
const COOKIE_PLAYER_ID = 'playerId';

export default class App extends LightningElement {
    @track nickname;
    @track session;
    @track errorMessage;
    @track playerId;
    @track playerLeaderboard = { Score__c: '-', Ranking__c: '-' };

    pingTimeout;
    ws;

    @wire(getCurrentSession)
    getCurrentSession({ error, data }) {
        if (data) {
            this.session = data;
        } else if (error) {
            if (error.status && error.status === 404) {
                this.resetGame();
            }
            this.errorMessage = getErrorMessage(error);
        }
    }

    @wire(getPlayerLeaderboard, { playerId: '$playerId' })
    getPlayerLeaderboard({ error, data }) {
        if (data) {
            this.playerLeaderboard = data;
        } else if (error) {
            if (error.status && error.status === 404) {
                this.resetGame();
            }
            this.errorMessage = getErrorMessage(error);
        }
    }

    connectedCallback() {
        this.nickname = getCookie(COOKIE_PLAYER_NICKNAME);
        this.playerId = getCookie(COOKIE_PLAYER_ID);

        // Get WebSocket URL
        const wsUrl =
            (window.location.protocol === 'http:' ? 'ws://' : 'wss://') +
            window.location.host;
        // Connect WebSocket
        this.ws = new WebSocketClient(wsUrl);
        this.ws.connect();
        this.ws.addMessageListener(message => {
            this.handleWsMessage(message);
        });
    }

    handleWsMessage(message) {
        if (message.type === 'phaseChangeEvent') {
            this.session = message.data;
            if (this.session === PHASES.REGISTRATION) {
                this.resetGame();
            }
        }
    }

    handleRegistered(event) {
        const { nickname, playerId } = event.detail;

        setCookie(COOKIE_PLAYER_NICKNAME, nickname);
        this.nickname = nickname;

        setCookie(COOKIE_PLAYER_ID, playerId);
        this.playerId = playerId;
    }

    handleAnswer(event) {
        const { answer } = event.detail;
        this.session.Phase__c = PHASES.POST_QUESTION;
        submitAnswer(answer)
            .then(() => {})
            .catch(error => {
                this.errorMessage = getErrorMessage(error);
            });
    }

    resetGame() {
        clearAllCookies();
        window.location.reload();
    }

    // UI expressions

    get isAuthenticated() {
        return this.nickname !== '';
    }

    get isRegistrationPhase() {
        return this.session.Phase__c === PHASES.REGISTRATION;
    }

    get isPreQuestionPhase() {
        return this.session.Phase__c === PHASES.PRE_QUESTION;
    }

    get isQuestionPhase() {
        return this.session.Phase__c === PHASES.QUESTION;
    }

    get isPostQuestionPhase() {
        return this.session.Phase__c === PHASES.POST_QUESTION;
    }

    get isQuestionResultsPhase() {
        return this.session.Phase__c === PHASES.QUESTION_RESULTS;
    }

    get isGameResultsPhase() {
        return this.session.Phase__c === PHASES.GAME_RESULTS;
    }
}
