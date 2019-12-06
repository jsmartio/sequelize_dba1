const express   = require('express')
const donors     = express.Router()
const cors      = require('cors')
const server    = require('../components/ServerFunctions')
const pj        = require('../components/config.json')
const Donor     = require('../models/Donor')
const DonorCategory     = require('../models/DonorCategory')

donors.use(cors())

donors.post('/getdonors2', (req, res) => {

    // establish that refering url is allowed
    let refer = server.stripDown(req.headers.referer)
    if( (refer.includes(pj.global.domain)  && req.session.uuid !== undefined) || pj.global.testmode === 'on') {
      Donor.findAll({
        where: {donorKey: req.body.rest },
      })
      .then(data => {
        res.send(data)
      })
      .catch(err => {
        console.log("Client Error @ UserFunctions > get_donors" + err)
        res.status(404).send('Error Location 102').end()
      })
    } else {
      console.log('+++ not permitted to get use data')
      res.sendStatus(403).end()
    }
  })

  donors.post('/donor_category2', (req, res) => {

    let refer = server.stripDown(req.headers.referer)
    if( (refer.includes(pj.global.domain)  && req.session.uuid !== undefined) || pj.global.testmode === 'on') {
      DonorCategory.findAll()
      .then(data => {
        res.send(data)
      })
      .catch(err => {
        console.log("Client Error @ UserFunctions > get_donors" + err)
        res.status(404).send('Error Location 102').end()
      })
    } else {
      console.log('+++ not permitted to get use data')
      res.sendStatus(403).end()
    }
  })

  module.exports = donors