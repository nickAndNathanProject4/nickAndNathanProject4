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

        if (nextGame.home_team.id === teamID) {
            // console.log("next opponent", nextGame.visitor_team.full_name)

            opponentTeamID = nextGame.visitor_team.id;
            sdioOpponentPlayers = `stats/json/Players/${nextGame.visitor_team.abbreviation}`
        } else {
            // console.log("next opponent", nextGame.home_team.full_name)

            opponentTeamID = nextGame.home_team.id;
            sdioOpponentPlayers = `stats/json/Players/${nextGame.home_team.abbreviation}`
        }

        // console.log("opponent team id", opponentTeamID);
        
        // app.playerPagination();



        

        const sdioReturn = app.getSDIOData(sdioOpponentPlayers);
        sdioReturn.then((result) => {
            console.log("array of opponent players", result)
            // NOTE i get back an array of player objects

            app.currentOpponentPlayers = result;

            app.opponentPlayersPositionMatch = app.currentOpponentPlayers.filter((playerObject) => {
                return playerObject["Position"] == playerOneSeasonStats[0]["Position"]
            })
            console.log("array of opponent players with match pos", app.opponentPlayersPositionMatch);

            if (app.opponentPlayersPositionMatch.length > 1) {
                app.opponentPlayersPositionMatch.sort((a, b) => (a.DepthChartOrder > b.DepthChartOrder) ? 1 : -1)
            };


            const playerTwoID = app.opponentPlayersPositionMatch[0].PlayerID;
            console.log("player two id", playerTwoID);

            const playerTwoSeasonStatsByID = `stats/json/PlayerSeasonStatsByPlayer/2020/${playerTwoID}`;



            const headshotURL = `https://nba-players.herokuapp.com/players/${app.opponentPlayersPositionMatch[0].LastName}/${app.opponentPlayersPositionMatch[0].FirstName}`;

            let playerTwoHeightFeet = ((app.opponentPlayersPositionMatch[0].Height) - (app.opponentPlayersPositionMatch[0].Height % 12)) / 12;
            let playerTwoHeightInches = (app.opponentPlayersPositionMatch[0].Height % 12);

            $('#playerComparison #playerTwo').append(`
                <div>
                <img src="${headshotURL}" alt="Photo of ${app.opponentPlayersPositionMatch[0].FirstName} ${app.opponentPlayersPositionMatch[0].LastName}">
                <h4>${app.opponentPlayersPositionMatch[0].FirstName} ${app.opponentPlayersPositionMatch[0].LastName}</h4>
                <div class="bio">
                <p>position: ${app.opponentPlayersPositionMatch[0].Position}</p>
                <p>height: ${playerTwoHeightFeet}' ${playerTwoHeightInches}"</p>
                <p>weight: ${app.opponentPlayersPositionMatch[0].Weight}lbs</p>
                </div>
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







        //     let playerTwoData = app.getBDIData(`stats?seasons[]=2019&player_ids[]=${playerID}&postseason=false&per_page=100`)

        //     playerOneData.then(playerData => {
        //         playerOneBio = playerData.data[0].player;
        //         console.log("player one bio", playerOneBio);
        //         const headshotURL = `https://nba-players.herokuapp.com/players/${playerOneBio.last_name}/${playerOneBio.first_name}`
        //         $('#playerComparison #playerOne').append(`
        //     <div>
        //     <img src="${headshotURL}" alt="Photo of ${playerOneBio.first_name} ${playerOneBio.last_name}">
        //     <h4>${playerOneBio.first_name} ${playerOneBio.last_name}</h4>
        //     <div class="bio">
        //     <p>position: ${playerOneBio.position}</p>
        //     <p>height: ${playerOneBio.height_feet}' ${playerOneBio.height_inches}"</p>
        //     <p>weight: ${playerOneBio.weight_pounds}lbs</p>
        //     </div>
        //     </div>
        // `)
        // });




    
    });
})

}



// app.playerPagination = () => {
//     for (let i = 0; i <= 33; i++) {
//         app.getAllPlayers(i);
//     };
//     // app.opponentPlayerStats();
// };

// app.getAllPlayers = async (num) => {
//     const allPlayers = await app.getBDIData(`players?page=${num}&per_page=100`);

//     app.filteredOpponentPlayers = allPlayers.data.filter((player) => {
//         // console.log("player", player);
//         return player.team.id == opponentTeamID;

//     });
//     app.opponentPlayers = app.opponentPlayers.concat(app.filteredOpponentPlayers);
//     // console.log(`all id: ${opponentTeamID}opponents`, app.opponentPlayers);
// };
// console.log(`all id: ${opponentTeamID}opponents`, app.opponentPlayers);

// app.opponentPlayerStats = () => {
//     app.opponentPlayers.forEach(player => {
//         // console.log("player from opponent stats func", player);

//         const playerStats = app.getBDIData(`stats?seasons[]=2019&player_ids[]=${player.id}&postseason=false`);

//         // console.log("player stat api return", playerStats);

//         playerStats.then((result) => {
//             // console.log("player stat api return then", result)
//             if (result.data.length !== 0) {
//                 // console.log("player data after if", player.data)
//                 app.currentOpponentPlayers.push(player);
//             };

//         })
//         // console.log("current opponent players", app.currentOpponentPlayers)
//     })
// }

// app.opponentPlayers.forEach(player => {
//     // app.opponentPlayerStats(player.id);
//     console.log("current opponent stat", app.opponentPlayerStats(player.id))

    
// });




// PLAYER MATCHUP=======================================
let playerOneBio;
let playerTwoBio;
let playerOneTeamAbbrev;
let playerOneSeasonStats;
let playerTwoSeasonStats;

app.getPlayerComparison = function(){
    // $('#playerComparison').removeClass('visuallyhidden');
    $("#playerComparison").slideDown("slow");
    let playerID = $(this).val();

    let playerOneData = app.getBDIData(`stats?seasons[]=2019&player_ids[]=${playerID}&postseason=false&per_page=100`)
    
    playerOneData.then(playerData => {
        playerOneBio = playerData.data[0].player;
        console.log("player one bio",playerOneBio);
        const headshotURL = `https://nba-players.herokuapp.com/players/${playerOneBio.last_name}/${playerOneBio.first_name}`
        $('#playerComparison #playerOne').append(`
            <div>
            <img src="${headshotURL}" alt="Photo of ${playerOneBio.first_name} ${playerOneBio.last_name}">
            <h4>${playerOneBio.first_name} ${playerOneBio.last_name}</h4>
            <div class="bio">
            <p>position: ${playerOneBio.position}</p>
            <p>height: ${playerOneBio.height_feet}' ${playerOneBio.height_inches}"</p>
            <p>weight: ${playerOneBio.weight_pounds}lbs</p>
            </div>
            </div>
        `)

        for (let item in app.teamAbbrevID) {
            // console.log("item from for in", item)
            // console.log("player one team id to string for in", playerOneBio.team_id.toString())

            if (item == playerOneBio.team_id.toString()) {
                // console.log("team abbrev id dot item", app.teamAbbrevID[item])
                playerOneTeamAbbrev = app.teamAbbrevID[item];
            }
        }

        const playerOneFullName = `${playerOneBio.first_name} ${playerOneBio.last_name}`;

        // console.log("player one full name", playerOneFullName)

        // console.log("player one team abbrev", playerOneTeamAbbrev);

        const playerOneSeasonStatsByTeam = `stats/json/PlayerSeasonStatsByTeam/2020/${playerOneTeamAbbrev}`;

        // console.log("player season stats by team string", playerSeasonStatsByTeam)

        app.getSDIOData(playerOneSeasonStatsByTeam).then((result) => {
            // console.log("player season stats by team api result", result)
            // console.log("player object result 0", result[0]["Name"])
            // result.forEach((playerObject) => {
            //     console.log("team players", playerObject["Name"])
            // })

            playerOneSeasonStats = result.filter((playerObject) => {
                return playerObject["Name"] == playerOneFullName;
            })
            console.log("player one season stats", playerOneSeasonStats);
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
