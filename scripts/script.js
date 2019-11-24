// NAMESPACE====================================================
const app = {};
// =============================================================


// GLOBAL VARIABLES=============================================
app.baseURI = "https://www.balldontlie.io/api/v1";

const $playerSearchForm = $("#playerSearchForm");
const $playerSearchSelect = $("#playerSearchSelect");

app.fantasyTeam = [];
app.demoTeam = [
    "416",
    "278",
    "237",
    "176",
    "145",
    "306",
    "15",
    "335",
    "367",
    "228"
];
// =============================================================

app.getPlayerSearch = () => {
    $playerSearchForm.on("submit", (event) => {
        event.preventDefault();

        // $("#playerSearchForm")[0].reset();

        // $("#playerSearchResults").removeClass("hidden")

        const $searchField = $("#playerSearchInput").val()
        // console.log("player search", $searchField)

        const playerChoice = app.getBDIData(`players?search=${$searchField}`)
        playerChoice.then((playerData) => {
            // console.log("player data", playerData)
            // console.log("player data.data", playerData.data)


            const searchPlayerArray = playerData.data
            // console.log("search player array", searchPlayerArray);

            searchPlayerArray.forEach(element => {
                // is it working?
                // console.log("searchPlayerArray", element.first_name, element.last_name, element.team.abbreviation)

                // populate drop down with search results
                $playerSearchSelect.append(`<option value="${element.id}">${element.first_name} ${element.last_name} (${element.team.abbreviation})</option>`)
            });

            // app.getPlayerSelectValue();

        })
    })
}

// EVENT LISTENERS==================================================
$("#addPlayer").on("click", function() {
    app.getPlayerSelectValue();
    $("#playerSearchSelect").html(`<option value="players">choose a player:</option>`);
    app.displayTeam();
})

$("#demo").on("click", function() {
    $(".welcomeInstructions").toggleClass("visuallyhidden");
    app.fantasyTeam = app.demoTeam;
    app.displayTeam();
})

$("#begin").on("click", function() {
    $(".welcomeInstructions").toggleClass("visuallyhidden");
});

$("#dashboard").on("click", function() {
    // $("#playerComparison").toggleClass("visuallyhidden");
    $("#playerComparison").slideUp("slow");
    $(".comparisonContent").html(`
        <div id='playerOne'>
        </div>
        <div id='playerTwo'>
        </div>
        `)
})
// ===================================================================


app.getNextGame = (teamID) => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const day = today.getDate().toString();
    if (day.length < 2) {
        day = "0" + day;
    }

    const dateReformat = `${year}-${month}-${day}T00:00:00.000Z`

    const nextGamePromise = app.getBDIData(`games?team_ids[]=${teamID}&seasons[]=2019`);

    let dateArray = [];

    nextGamePromise.then(teamData => {
        console.log("teamdata", teamData.data)
        teamData.data.forEach(game => {
            dateArray.push(game.date);
        })
        dateArray.sort();

        dateArray = dateArray.filter(game => {
            const gameSplit = game.split("T");
            const reformatSplit = dateReformat.split("T");

            return gameSplit[0] > reformatSplit[0];
        });

        const nextGame = teamData.data.find(game => {
            return game.date === dateArray[0];
        })

        console.log("next game", nextGame);
        let opponentTeamID;

        if (nextGame.home_team.id === teamID) {
            console.log("next opponent", nextGame.visitor_team.full_name)
            opponentTeamID = nextGame.visitor_team.id;
        } else {
            console.log("next opponent", nextGame.home_team.full_name)
            opponentTeamID = nextGame.home_team.id;
        }

        console.log("opponent team id", opponentTeamID);




    
    });
}

app.opponentPlayers = [];
app.currentOpponentPlayers = [];

app.getAllPlayers = async (num) => {
    const allPlayers = await app.getBDIData(`players?page=${num}&per_page=100`);
    app.filteredOpponentPlayers = allPlayers.data.filter((player) => {
        // console.log("player", player);
        return player.team.id == 28;
    });
    app.opponentPlayers = app.opponentPlayers.concat(app.filteredOpponentPlayers);
    console.log("all raps", app.opponentPlayers);

};


app.playerPagination = () => {
    for (let i = 0; i <= 33; i++) {
        app.getAllPlayers(i);
    };
};


app.opponentPlayerStats = (playerID) => {
    const playerStats = app.getBDIData(`stats?seasons[]=2019&player_ids[]=${playerID}&postseason=false`)
}

app.opponentPlayers.forEach(player => {
    // app.opponentPlayerStats(player.id);
    console.log("current opponent stat", app.opponentPlayerStats(player.id))
    
})


// PLAYER MATCHUP=======================================
app.getPlayerComparison = function(){
    // $('#playerComparison').removeClass('visuallyhidden');
    $("#playerComparison").slideDown("slow");
    let playerOneBio;
    let playerID = $(this).val();

    let playerOneData = app.getBDIData(`stats?seasons[]=2019&player_ids[]=${playerID}&postseason=false&per_page=100`)
    
    playerOneData.then(playerData => {
        playerOneBio = playerData.data[0].player;
        console.log(playerOneBio);
        const headshotURL = `https://nba-players.herokuapp.com/players/${playerOneBio.last_name}/${playerOneBio.first_name}`
        $('#playerComparison #playerOne').append(`
            <div>
            <img src="${headshotURL}" alt="Photo of ${playerOneBio.first_name} ${playerOneBio.last_name}">
            <p>${playerOneBio.first_name} ${playerOneBio.last_name}</p>
            <p>position: ${playerOneBio.position}</p>
            <p>height: ${playerOneBio.height_feet}' ${playerOneBio.height_inches}"</p>
            <p>weight: ${playerOneBio.weight_pounds}lbs</p>
            </div>
        `)

        app.getNextGame(playerOneBio.team_id);
    });
};
// =========================================================




// SEARCH RESULT SELECTION==============================
app.getPlayerSelectValue = () => {
    const selection = $("option:selected").val();
    // console.log("player id", selection);

    app.fantasyTeam.push(selection);
    // console.log("fantasyTeam array", app.fantasyTeam);

};
// =======================================================




// DRAW PLAYER CARDS===================================
let playerBio;
app.displayTeam = () => {
    $("#teamGallery ul").empty();

    app.fantasyTeam.forEach((player) => {

        const player2019Stats = app.getBDIData(`stats?seasons[]=2019&player_ids[]=${player}&postseason=false&per_page=100`)

        player2019Stats.then((playerStats) => {
            // console.log("chosenPlayer2019Stats", playerStats)
            // console.log("chosenPlayer2019Stats.data", playerStats.data)
            
            const playerStatsArray = playerStats.data
            // let playerBio;
            if (playerStatsArray.length === 0) {
                alert("Oh no, stats aren't available for that player. Please choose another baller!")
            } else {
                playerBio = playerStatsArray[0].player

                // console.log("player bio", playerBio)
            }

            const headshotURL = `https://nba-players.herokuapp.com/players/${playerBio.last_name}/${playerBio.first_name}`

            // <div class="cardBack">
            // <img src="./assets/nba_logo_edit.jpg" alt="NBA logo">
            // </div>
            $("#teamGallery ul").append(`
            <li value=${playerBio.id} class="card">
            <div class="cardFront">
            <img src="${headshotURL}" alt="Photo of ${playerBio.first_name} ${playerBio.last_name}">
            <div class="bio">
            <p>${playerBio.first_name} ${playerBio.last_name}</p>
            <p>position: ${playerBio.position}</p>
            <p>height: ${playerBio.height_feet}' ${playerBio.height_inches}"</p>
            <p>weight: ${playerBio.weight_pounds}lbs</p>
            </div>
            </div>
            </li>
            `);
        })
    });
    $('#teamGallery ul').on('click', 'li', app.getPlayerComparison);
};
// =========================================



// API CALLS====================================================
app.getBDIData = (dataTypeBDI) => {
    return $.ajax({
        url: `${app.baseURI}/${dataTypeBDI}`,
        method: "GET",
        dataType: "json",
        data: {
            per_page: "100",
        }
    })
};

// =============================================================



// INIT=========================================================
app.init = () => {
    app.getPlayerSearch();
    // app.getAllPlayers();
    app.playerPagination();
};
// =============================================================



// DOCUMENT READY===============================================
$(function () {
    app.init();
});
// =============================================================
