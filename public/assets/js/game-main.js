function getParameterValue(requestedKey) {
  let pageIRI = window.location.search.substring(1);
  let pageIRIVariables = pageIRI.split('&');
  for (let i = 0; i < pageIRIVariables.length; i++) {
      let data = pageIRIVariables[i].split('=');
      let key = data[0];
      let value = data[1];
      if (key === requestedKey) {
          return value;
      }
  }
  return null;
}

$(document).ready(() => {

    let game_started = false;
    $("#p1-nickname").html(decodeURI(getParameterValue('username')));
  
    checkOrientation();
    $(window).on("orientationchange", checkOrientation);
  
    function startGameModal() {
  
      $('#myModal').modal('show');
  
      let game_info = {
        p1_nick: "Игрок 1",
        p1_color: "white",
        p2_nick: "Игрок 2",
        p2_color: "black",
        board_length: 8 
      };
  
      $("#p1-w").on("click", () => { p1w_p2b(); });
      $("#p1-b").on("click", () => { p1b_p2w(); });
      $("#p2-w").on("click", () => { p1b_p2w(); });
      $("#p2-b").on("click", () => { p1w_p2b(); });
  
      function p1w_p2b() {
        $("#p1-w").addClass("piece_selected");
        game_info.p1_color = "white";
        $("#p2-b").addClass("piece_selected");
        game_info.p2_color = "black";
  
        $("#p1-b").removeClass("piece_selected");
        $("#p2-w").removeClass("piece_selected");
      }
  
      function p1b_p2w() {
        $("#p1-b").addClass("piece_selected");
        game_info.p1_color = "black";
        $("#p2-w").addClass("piece_selected");
        game_info.p2_color = "white";
  
        $("#p1-w").removeClass("piece_selected");
        $("#p2-b").removeClass("piece_selected");
      }
  
      $("#start_game").on("click", () => {
  
        game_info.p1_nick = decodeURI(getParameterValue('username'));
        
        if ($("#p2-nickname").val() != "") 
          game_info.p2_nick = $("#p2-nickname").val();
  
        game_info.board_length = $("#board-length option:selected").val();
        
        init(game_info);
  
      });
  
    }
  
    function checkOrientation() {
  
      if (screen.orientation.type == "landscape-primary") {
  
        if (!game_started) 
          startGameModal();
        
      } else {
        $("#myModal").modal('hide');
        $("#myModal").hide();
      }
  
    }
  
    function init(game_info) {
  
      game_started = true;
      
      let player1 = new Player(game_info.p1_nick, game_info.p1_color);
      let player2 = new Player(game_info.p2_nick, game_info.p2_color);
  
      let game = new Game(player1, player2);
  
      game.newGame(game_info.board_length);
  
    }
  
  });