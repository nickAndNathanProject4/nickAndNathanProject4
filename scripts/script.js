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

let opponentTeamID;
let sdioOpponentPlayers;
app.opponentPlayers = [];
app.currentOpponentPlayers = [];
app.opponentPlayersPositionMatch = [];
let playerID;
let playerOneBio;
let playerTwoBio;
let playerOneTeamAbbrev;
let playerOneSeasonStats;
let playerOneSeasonStats2;
let playerTwoSeasonStats;
let playerOneStatAverages;
let playerTwoStatAverages;
let playerBio;
let listTracker = 1;
// =============================================================



// PLAYER SEARCH=================================================
app.getPlayerSearch = () => {
    $playerSearchForm.on("submit", (event) => {
        event.preventDefault();

        const $searchField = $("#playerSearchInput").val()

        const playerChoice = app.getBDIData(`players?search=${$searchField}`)
        playerChoice.then((playerData) => {

            const searchPlayerArray = playerData.data

            searchPlayerArray.forEach(element => {
                $playerSearchSelect.append(`<option value="${element.id}">${element.first_name} ${element.last_name} (${element.team.abbreviation})</option>`)
            });
        });
    });
};
// =================================================================



// EVENT LISTENERS==================================================
$("#addPlayer").on("click", function() {
    app.getPlayerSelectValue();
    $("#playerSearchSelect").html(`<option value="players">choose a player:</option>`);
    app.displayTeam();
});

$("#demo").on("click", function() {
    $(".welcomeInstructions").toggleClass("visuallyhidden");
    app.fantasyTeam = app.demoTeam;
    app.displayTeam();
});

$("#closeHelp").on("click", function() {
    $(".welcomeInstructions").toggleClass("visuallyhidden");
});

$("#helpIcon").on("click", function() {
    $(".welcomeInstructions").toggleClass("visuallyhidden");
});

$("#begin").on("click", function() {
    $(".welcomeInstructions").toggleClass("visuallyhidden");
});

$("#dashboard").on("click", function() {
    // $("#playerComparison").toggleClass("visuallyhidden");
    $("#playerComparison").slideUp("slow");
    $(".comparisonContent").html(`
        <div class="scrollLeft"><i class="fas fa-chevron-left"></i></div>
        <div id='playerOne' class="playerOne"></div>
        <div id='playerTwo' class="playerTwo"></div>
        <div class="scrollRight"><i class="fas fa-chevron-right"></i></div>
        `)
    $(".comparisonStats").html(`
        <div class="playerOneStats"></div>
        <div class="statKey">
            <ul>
                <li><p>pts</p></li>
                <li><p>reb</p></li>
                <li><p>ast</p></li>
                <li><p>stl</p></li>
                <li><p>blk</p></li>
            </ul>
        </div>
        <div class="playerTwoStats"></div>
    `)
})
// ===================================================================



// NEXT GAME AND OPPONENT=========================================
app.getNextGame = (teamID) => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const day = today.getDate().toString();

    if (day.length < 2) {
        day = "0" + day;
    };

    const dateReformat = `${year}-${month}-${day}T00:00:00.000Z`;

    const nextGamePromise = app.getBDIData(`games?team_ids[]=${teamID}&seasons[]=2019`);

    let dateArray = [];

    nextGamePromise.then(teamData => {
        teamData.data.forEach(game => {
            dateArray.push(game.date);
        });
        dateArray.sort();

        dateArray = dateArray.filter(game => {
            const gameSplit = game.split("T");
            const reformatSplit = dateReformat.split("T");

            return gameSplit[0] >= reformatSplit[0];
        });

        const nextGame = teamData.data.find(game => {
            return game.date === dateArray[0];
        });

        if (nextGame.home_team.id === teamID) {
            let abbrevKeys = Object.keys(app.teamAbbrevIDCheck);

            if (abbrevKeys.indexOf(nextGame.visitor_team.id.toString()) == -1) {
                sdioOpponentPlayers = `stats/json/Players/${nextGame.visitor_team.abbreviation}`;
            } else {
                sdioOpponentPlayers = `stats/json/Players/${app.teamAbbrevIDRefactor[nextGame.visitor_team.id]}`;
            };
        } else {
            let abbrevKeys = Object.keys(app.teamAbbrevIDCheck);
            if (abbrevKeys.indexOf(nextGame.home_team.id.toString()) == -1) {
                sdioOpponentPlayers = `stats/json/Players/${nextGame.home_team.abbreviation}`;
            } else {
                sdioOpponentPlayers = `stats/json/Players/${app.teamAbbrevIDRefactor[nextGame.home_team.id]}`;
            };
        };

        const sdioReturn = app.getSDIOData(sdioOpponentPlayers);

        sdioReturn.then((result) => {
            app.currentOpponentPlayers = result;

            app.opponentPlayersPositionMatch = app.currentOpponentPlayers.filter((playerObject) => {
                return (playerObject["Position"] == playerOneSeasonStats["Position"] && playerObject["DepthChartOrder"] !== null);
            });

            if (app.opponentPlayersPositionMatch.length > 1) {
                app.opponentPlayersPositionMatch.sort((a, b) => (a.DepthChartOrder > b.DepthChartOrder) ? 1 : -1)
            };

            const playerTwoID = app.opponentPlayersPositionMatch[0].PlayerID;

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
                <p>position: <span>${app.opponentPlayersPositionMatch[0].Position}</span></p>
                <p>height: <span>${playerTwoHeightFeet}' ${playerTwoHeightInches}"</span></p>
                <p>weight: <span>${app.opponentPlayersPositionMatch[0].Weight}lbs</span></p>
                </div>
            `)

            app.getSDIOData(playerTwoSeasonStatsByID).then((result) => {
                playerTwoSeasonStats = result;

                playerTwoStatAverages = app.statsKey.map((stat) => {
                    return app.seasonStatsAverages(playerTwoSeasonStats[stat], playerTwoSeasonStats.Games)
                });

                $('#comparisonStats .playerTwoStats').append(`
                <ul>
                <li><p>${playerTwoStatAverages[0].toFixed(1)}</p></li>
                <li><p>${playerTwoStatAverages[1].toFixed(1)}</p></li>
                <li><p>${playerTwoStatAverages[2].toFixed(1)}</p></li>
                <li><p>${playerTwoStatAverages[3].toFixed(1)}</p></li>
                <li><p>${playerTwoStatAverages[4].toFixed(1)}</p></li>
                </ul>
            `)
            });
        });
    });
};
// ================================================================



// PLAYER MATCHUP=======================================
app.seasonStatsAverages = (statType, games) => {
    return (statType / games);
};
app.statsKey = ["Points", "Rebounds", "Assists", "Steals", "BlockedShots"];

app.getPlayerComparison = function(){
    $("#playerComparison").slideDown("slow");
    playerID = $(this).val();

    let playerOneData = app.getBDIData(`stats?seasons[]=2019&player_ids[]=${playerID}&postseason=false&per_page=100`)
    
    playerOneData.then(playerData => {
        playerOneBio = playerData.data[0].player;
        const headshotURL = `https://nba-players.herokuapp.com/players/${playerOneBio.last_name}/${playerOneBio.first_name}`
        $('#playerComparison #playerOne').append(`
            <div class="imageContainer">
            <img src="${headshotURL}" alt="Photo of ${playerOneBio.first_name} ${playerOneBio.last_name}">
            </div>
            <h4>${playerOneBio.first_name} ${playerOneBio.last_name}</h4>
            <div class="bio">
            <p>position: <span>${playerOneBio.position}</span></p>
            <p>height: <span>${playerOneBio.height_feet}' ${playerOneBio.height_inches}"</span></p>
            <p>weight: <span>${playerOneBio.weight_pounds}lbs</span></p>
            </div>
        `);

        const playerOneFullName = `${playerOneBio.first_name} ${playerOneBio.last_name}`;

        let abbrevKeys = Object.keys(app.teamAbbrevIDCheck);
        if (abbrevKeys.indexOf(playerOneBio.team_id.toString()) == -1) {
            playerOneTeamAbbrev = app.teamAbbrevID[playerOneBio.team_id.toString()];
        } else {
            playerOneTeamAbbrev = app.teamAbbrevIDRefactor[playerOneBio.team_id.toString()]
        };

        const playerOneSeasonStatsByTeam = `stats/json/PlayerSeasonStatsByTeam/2020/${playerOneTeamAbbrev}`;

        app.getSDIOData(playerOneSeasonStatsByTeam).then((result) => {
            playerOneSeasonStats = result.filter((playerObject) => {
                return playerObject["Name"] == playerOneFullName;
            });
            playerOneSeasonStats = playerOneSeasonStats[0];

            const playerOneSeasonStatsByID = `stats/json/PlayerSeasonStatsByPlayer/2020/${playerOneSeasonStats.PlayerID}`;

            app.getSDIOData(playerOneSeasonStatsByID).then( (result) => {

                playerOneSeasonStats = result;
                playerOneStatAverages = app.statsKey.map( (stat) => {
                    return app.seasonStatsAverages(playerOneSeasonStats[stat], playerOneSeasonStats.Games)
                });
    
                $('#comparisonStats .playerOneStats').append(`
                    <ul>
                    <li><p>${playerOneStatAverages[0].toFixed(1)}</p></li>
                    <li><p>${playerOneStatAverages[1].toFixed(1)}</p></li>
                    <li><p>${playerOneStatAverages[2].toFixed(1)}</p></li>
                    <li><p>${playerOneStatAverages[3].toFixed(1)}</p></li>
                    <li><p>${playerOneStatAverages[4].toFixed(1)}</p></li>
                    </ul>
                `);
            });
        });
        app.getNextGame(playerOneBio.team_id);
    });
};
// =========================================================



// SEARCH RESULT SELECTION==============================
app.getPlayerSelectValue = () => {
    const selection = $("option:selected").val();
    app.fantasyTeam.push(selection);
};
// =======================================================



// DRAW PLAYER CARDS===================================
app.displayTeam = () => {
    $("#teamGallery").toggleClass("visuallyhidden");
    $("#teamGallery ul").empty();
    app.fantasyTeam.forEach((player) => {

        const player2019Stats = app.getBDIData(`stats?seasons[]=2019&player_ids[]=${player}&postseason=false&per_page=100`)

        player2019Stats.then((playerStats) => {
            
            const playerStatsArray = playerStats.data;
            if (playerStatsArray.length === 0) {
                alert("Oh no, stats aren't available for that player. Please choose another baller!")
            } else {
                playerBio = playerStatsArray[0].player
            };

            const headshotURL = `https://nba-players.herokuapp.com/players/${playerBio.last_name}/${playerBio.first_name}`;

            $("#teamGallery ul").append(`
            <li value=${playerBio.id} class="card" listTrack=${listTracker}>
            <div class="cardFront">
            <img src="${headshotURL}" alt="Photo of ${playerBio.first_name} ${playerBio.last_name}">
            <div class="bio">
            <h4>${playerBio.first_name} ${playerBio.last_name}</h4>
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
        method: "GET",
        dataType: "json",
    })
};
// =============================================================



// INIT=========================================================
app.init = () => {
    app.getPlayerSearch();
};
// =============================================================



// DOCUMENT READY===============================================
$(function () {
    app.init();
});
// =============================================================
