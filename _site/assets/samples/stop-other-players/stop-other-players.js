// create array for player IDs
var players = [];
// determine the available player IDs
for (x = 0; x < Object.keys(videojs.players).length; x++) {
    // assign the player to setPlayer
    var setPlayer = Object.keys(videojs.players)[x];
    // define the ready event for the player
    videojs(setPlayer).ready(function () {
        // assign this player to a variable
        player = this;
        // assign and event listener for play event
        player.on('play', onPlay);
        // push the player to the players array
        players.push(player);
    });
}
// event listner callback function
function onPlay(e) {
    // determine which player the event is coming from
    var id = e.target.id;
    // go through the array of players
    for (var i = 0; i < players.length; i++) {
        // get the player(s) that did not trigger the play event
        if (players[i].id() != id) {
            //log the players that were paused
            //console.log(players[i].id());
            // pause the other player(s)
            videojs(players[i].id()).pause();
        }
    }
}
