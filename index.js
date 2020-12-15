const DEBUG = true;

const uWS = require("uWebSockets.js");
const port = 8080;

const app = uWS
  .App()
  .ws("/*", {
    /* Options */
    compression: uWS.SHARED_COMPRESSOR,
    maxPayloadLength: 16 * 1024 * 1024,
    idleTimeout: 0,
    maxBackpressure: 1024,

    /* Todo, Setting 1: merge messages in one, or keep them as separate WebSocket frames - mergePublishedMessages */
    /* Todo, Setting 4: send to all including us, or not? That's not a setting really just use ws.publish or global uWS.publish */

    /* Handlers */
    open: (ws) => {
      /* Let this client listen to all sensor topics */
      //ws.subscribe('home/sensors/#');
      console.log("open");
    },
    message: (ws, message, isBinary) => {
      try {
        // on convertit le message en chaine de caractère
        const stringMessage = Buffer.from(message).toString("utf8");
        if (DEBUG) console.log(stringMessage);
        // On décode le message JSON
        const jsonMessage = JSON.parse(stringMessage);
        // On envoi le message au routeur
        dispatchMessage(ws, jsonMessage);
      } catch (error) {
        console.error("onNewMessage " + error);
      }
    },
    drain: (ws) => {},
    close: (ws, code, message) => {
      /* The library guarantees proper unsubscription at close */

      console.log("close");
    },
  })
  .any("/*", (res, req) => {
    res.end("Nothing to see here!");
  })
  .listen(port, (token) => {
    if (token) {
      console.log("Listening to port " + port);
    } else {
      console.log("Failed to listen to port " + port);
    }
  });

function dispatchMessage(ws, message) {
  switch (message.t) {
    case 0: //
      break;
    case 1: // Join Game
      joinGame(ws, message);
      break;
    case 1: // Player play
      play(ws, message);
      break;
    default:
      if (DEBUG) console.log("type inconnu");
  }
}

function joinGame(ws, message) {
  if (DEBUG) console.log("join");
  ws.game = message.mi;
  ws.subscribe(`game/${message.mi}`);
}
function play(ws, message) {
  if (DEBUG) console.log("play");
  ws.publish(`game/${ws.game}`, JSON.stringify(message));
}
