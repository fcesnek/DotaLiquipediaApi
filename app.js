const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const DotaController = require('./controllers/DotaController')
const config = require('./config/config')

const app = express()

app.use(morgan('combined'))
app.use(cors())

app.get('/tourneyList', DotaController.listOngoingAndUpcomingTourneys);
app.get('/gamesList', DotaController.listOngoingAndUpcomingGames);
app.get('/tourneyInfo', DotaController.getTournamentInfo);
app.get('/teamInfo', DotaController.getTeamInfo);
app.get('/matchInfo', DotaController.getMatchInfo);

app.listen(config.port)
console.log(`Server started on port ${config.port}`)
