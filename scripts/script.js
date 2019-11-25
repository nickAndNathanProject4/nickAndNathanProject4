// NAMESPACE====================================================
const app = {};
// =============================================================


// GLOBAL VARIABLES=============================================
app.baseBDIURI = "https://www.balldontlie.io/api/v1";
app.baseSDIOURI = "https://api.sportsdata.io/v3/nba";
app.keySDIO = "b89d8f35286d40bea76016a8d3b5a9cd";

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

app.teamAbbrevID = {
    1: "ATL",
    2: "BOS",
    3: "BKN",
    4: "CHA",
    5: "CHI",
    6: "CLE",
    7: "DAL",
    8: "DEN",
    9: "DET",
    10: "GSW", 
    11: "HOU",
    12: "IND",
    13: "LAC",
    14: "LAL",
    15: "MEM",
    16: "MIA",
    17: "MIL",
    18: "MIN",
    19: "NOP",
    20: "NYK",
    21: "OKC",
    22: "ORL",
    23: "PHI",
    24: "PHX",
    25: "POR",
    26: "SAC",
    27: "SAS",
    28: "TOR",
    29: "UTA",
    30: "WAS"
};

app.teamAbbrevIDCheck = {
    10: "GSW",
    19: "NOP",
    20: "NYK",
    24: "PHX",
    27: "SAS"
};

app.teamAbbrevIDRefactor = {
    1: "ATL",
    2: "BOS",
    3: "BKN",
    4: "CHA",
    5: "CHI",
    6: "CLE",
    7: "DAL",
    8: "DEN",
    9: "DET",
    10: "GS",
    11: "HOU",
    12: "IND",
    13: "LAC",
    14: "LAL",
    15: "MEM",
    16: "MIA",
    17: "MIL",
    18: "MIN",
    19: "NO",
    20: "NY",
    21: "OKC",
    22: "ORL",
    23: "PHI",
    24: "PHO",
    25: "POR",
    26: "SAC",
    27: "SA",
    28: "TOR",
    29: "UTA",
    30: "WAS"
};
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
        <div class="scrollLeft"></div>
        <div id='playerOne' class="playerOne">
        </div>
        <div id='playerTwo' class="playerTwo">
        </div>
        <div class="scrollRight"></div>
        `)
})
// ===================================================================

let opponentTeamID;
let sdioOpponentPlayers;
app.opponentPlayers = [];
app.currentOpponentPlayers = [];
app.opponentPlayersPositionMatch = [];

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
        // console.log("teamdata", teamData.data)
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

        // console.log("next game", nextGame);
        // let opponentTeamID;

        // console.log("player team id", teamID);

        if (nextGame.home_team.id === teamID) {
            let abbrevKeys = Object.keys(app.teamAbbrevIDCheck);
            // console.log("abbrev keys", abbrevKeys);
            // console.log("visitor team id", nextGame.visitor_team.id);

            if (abbrevKeys.indexOf(nextGame.visitor_team.id.toString()) == -1) {
                sdioOpponentPlayers = `stats/json/Players/${nextGame.visitor_team.abbreviation}`;
            } else {
                sdioOpponentPlayers = `stats/json/Players/${app.teamAbbrevIDRefactor[nextGame.visitor_team.id]}`;
            }
        } else {
            let abbrevKeys = Object.keys(app.teamAbbrevIDCheck);
            // console.log("abbrev keys", abbrevKeys);
            // console.log("home team id", nextGame.home_team.id);
            if (abbrevKeys.indexOf(nextGame.home_team.id.toString()) == -1) {
                sdioOpponentPlayers = `stats/json/Players/${nextGame.home_team.abbreviation}`;
            } else {
                // console.log("refactor")
                sdioOpponentPlayers = `stats/json/Players/${app.teamAbbrevIDRefactor[nextGame.home_team.id]}`;
            }
        }

        // console.log("opponent team id", opponentTeamID);
        // console.log("sdio opponent", sdioOpponentPlayers);

        const sdioReturn = app.getSDIOData(sdioOpponentPlayers);
        sdioReturn.then((result) => {
            // console.log("array of opponent players", result)

            app.currentOpponentPlayers = result;

            app.opponentPlayersPositionMatch = app.currentOpponentPlayers.filter((playerObject) => {
                return (playerObject["Position"] == playerOneSeasonStats[0]["Position"] && playerObject["DepthChartOrder"] !== null);
            });

            // console.log("array of opponent players with match pos", app.opponentPlayersPositionMatch);

            if (app.opponentPlayersPositionMatch.length > 1) {
                app.opponentPlayersPositionMatch.sort((a, b) => (a.DepthChartOrder > b.DepthChartOrder) ? 1 : -1)
            };

            const playerTwoID = app.opponentPlayersPositionMatch[0].PlayerID;
            // console.log("player two id", playerTwoID);

            const playerTwoSeasonStatsByID = `stats/json/PlayerSeasonStatsByPlayer/2020/${playerTwoID}`;

            const headshotURL = `https://nba-players.herokuapp.com/players/${app.opponentPlayersPositionMatch[0].LastName}/${app.opponentPlayersPositionMatch[0].FirstName}`;

            let playerTwoHeightFeet = ((app.opponentPlayersPositionMatch[0].Height) - (app.opponentPlayersPositionMatch[0].Height % 12)) / 12;
            let playerTwoHeightInches = (app.opponentPlayersPositionMatch[0].Height % 12);

            $('#playerComparison #playerTwo').append(`
                <div class="imageContainer">
                <img src="${headshotURL}" alt="Photo of ${app.opponentPlayersPositionMatch[0].FirstName} ${app.opponentPlayersPositionMatch[0].LastName}" onerror="this.onerror=null;this.src='./assets/blank_headshot_silhouette.png';">
                </div>
                <h4>${app.opponentPlayersPositionMatch[0].FirstName} ${app.opponentPlayersPositionMatch[0].LastName}</h4>
                <div class="bio">
                <p>position: ${app.opponentPlayersPositionMatch[0].Position}</p>
                <p>height: ${playerTwoHeightFeet}' ${playerTwoHeightInches}"</p>
                <p>weight: ${app.opponentPlayersPositionMatch[0].Weight}lbs</p>
                </div>
            `)

            app.getSDIOData(playerTwoSeasonStatsByID).then((result) => {
                // console.log("player season stats by team api result", result)
                // console.log("player object result 0", result[0]["Name"])
                // result.forEach((playerObject) => {
                //     console.log("team players", playerObject["Name"])
                // })

                // playerTwoSeasonStats = result.filter((playerObject) => {
                //     return playerObject["Name"] == playerOneFullName;
                // })
                // console.log("player one season stats", playerOneSeasonStats);
                console.log("player two seasons stats api result", result);
            })
        });
    });
};



// PLAYER MATCHUP=======================================
let playerID;
let playerOneBio;
let playerTwoBio;
let playerOneTeamAbbrev;
let playerOneSeasonStats;
let playerTwoSeasonStats;

app.getPlayerComparison = function(){
    // $('#playerComparison').removeClass('visuallyhidden');
    $("#playerComparison").slideDown("slow");
    playerID = $(this).val();

    let playerOneData = app.getBDIData(`stats?seasons[]=2019&player_ids[]=${playerID}&postseason=false&per_page=100`)
    
    playerOneData.then(playerData => {
        playerOneBio = playerData.data[0].player;
        console.log("player one bio",playerOneBio);
        const headshotURL = `https://nba-players.herokuapp.com/players/${playerOneBio.last_name}/${playerOneBio.first_name}`
        $('#playerComparison #playerOne').append(`
            <div class="imageContainer">
            <img src="${headshotURL}" alt="Photo of ${playerOneBio.first_name} ${playerOneBio.last_name}">
            </div>
            <h4>${playerOneBio.first_name} ${playerOneBio.last_name}</h4>
            <div class="bio">
            <p>position: ${playerOneBio.position}</p>
            <p>height: ${playerOneBio.height_feet}' ${playerOneBio.height_inches}"</p>
            <p>weight: ${playerOneBio.weight_pounds}lbs</p>
            </div>
        `)

        const playerOneFullName = `${playerOneBio.first_name} ${playerOneBio.last_name}`;

        // console.log("player one team id", playerOneBio.team_id)

        let abbrevKeys = Object.keys(app.teamAbbrevIDCheck);
        if (abbrevKeys.indexOf(playerOneBio.team_id.toString()) == -1) {
            playerOneTeamAbbrev = app.teamAbbrevID[playerOneBio.team_id.toString()];
        } else {
            playerOneTeamAbbrev = app.teamAbbrevIDRefactor[playerOneBio.team_id.toString()]
            // playerOneTeamAbbrev = app.teamAbbrevIDCheck[]
        }

        // console.log("player one team abbrev", playerOneTeamAbbrev);
        // console.log("player one full name", playerOneFullName)
        // console.log("player one team abbrev", playerOneTeamAbbrev);

        const playerOneSeasonStatsByTeam = `stats/json/PlayerSeasonStatsByTeam/2020/${playerOneTeamAbbrev}`;

        // console.log("player season stats by team string", playerOneSeasonStatsByTeam)

        app.getSDIOData(playerOneSeasonStatsByTeam).then((result) => {
            // console.log("player one season stat api return", result)
            playerOneSeasonStats = result.filter((playerObject) => {
                return playerObject["Name"] == playerOneFullName;
            })
            // console.log("player one season stats", playerOneSeasonStats);
        });

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
let listTracker=1;
app.displayTeam = () => {
    $("#teamGallery ul").empty();
    console.log("fantasy team array", app.fantasyTeam);
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
            <li value=${playerBio.id} class="card" listTrack=${listTracker}>
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
            listTracker++;
        });
    });
    $('#teamGallery ul').on('click', 'li', app.getPlayerComparison);
};
// =========================================



// API CALLS====================================================
app.getBDIData = (dataTypeBDI) => {
    return $.ajax({
        url: `${app.baseBDIURI}/${dataTypeBDI}`,
        method: "GET",
        dataType: "json",
        data: {
            per_page: "100",
        }
    })
};

app.getSDIOData = (dataTypeSDIO) => {
    return $.ajax ({
        url: `${app.baseSDIOURI}/${dataTypeSDIO}?key=${app.keySDIO}`,
        // url: `${app.baseSDIOURI}/stats/json/Players/tor`,
        method: "GET",
        dataType: "json",
        // key: `${app.keySDIO}`
    })
    // .then((result) => {
    //     console.log("sdio result", result)
    // })




};

// let sdiotorplayer = "stats/json/Players/tor";

// =============================================================



// INIT=========================================================
app.init = () => {
    app.getPlayerSearch();
    // app.getAllPlayers();
    // app.playerPagination();

    // app.getSDIOData(sdiotorplayer);

    // sdio.then((result) => {
    //     console.log("sdio then", result);
    // });
};
// =============================================================



// DOCUMENT READY===============================================
$(function () {
    app.init();
});
// =============================================================
