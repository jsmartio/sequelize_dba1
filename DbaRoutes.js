const express   = require('express')
const dbadmin   = express.Router()
const cors      = require('cors')
const server    = require('../components/ServerFunctions')
const pj        = require('../components/config.json')
const Donor     = require('../models/Donor')
const sh        = require('shelljs')
const db        = require('../database/db')
const config     = require('../components/config.json')

dbadmin.use(cors())

// !! remember this is a server file on port 5000 so don't use /dba

dbadmin.post('/restorfromnew2', (req, res) => {
  let DBname = req.body.DBname;
  let dump = `mysqldump -u ${config.global.dbuser} -p${config.global.dbpass} ${DBname} > ./tmp/${DBname}.sql`
  let copy = `mysql -u ${config.global.dbuser} -p${config.global.dbpass} ${config.global.root_db_name} < ./tmp/${DBname}.sql`
  //dump = 'pwd'
  sh.exec(dump, (code, output) => {
    sh.exec(copy, (code, output) => {
      res.json({success: 'restored (MainDB:'+config.global.root_db_name+') from ' + DBname}).end()
    })
  })
})

dbadmin.post('/restormain', (req, res) => {
    let copy = `mysql -u ${config.global.dbuser} -p${config.global.dbpass} ${config.global.root_db_name} < ./tmp/${config.global.root_db_name}_copy.sql`
    sh.exec(copy, (code, output) => {
      res.json({success: 'restored (MainDB:' + config.global.root_db_name + ') from sql file'}).end()
    })
})

dbadmin.post('/copyfromdb2', (req, res) => {
  let DBname = req.body.DBname;
  let dump = `mysqldump -u ${config.global.dbuser} -p${config.global.dbpass} envision > ./tmp/${config.global.root_db_name}.sql`
  let copy = `mysql -u ${config.global.dbuser} -p${config.global.dbpass} ${DBname} < ./tmp/${config.global.root_db_name}.sql`
  //dump = 'pwd'
  sh.exec(dump, (code, output) => {
    sh.exec(copy, (code, output) => {
      res.json({success: 'Main DB: ' + config.global.root_db_name + ' -> copied to -> ' + DBname }).end()

    })
  })
})

dbadmin.post('/removedupes2', (req, res) => {
    // establish that refering url is allowed
    let refer = server.stripDown(req.headers.referer)
    if( (refer.includes(pj.global.domain)  && req.session.uuid !== undefined) || pj.global.testmode === 'on') {
      var sql = `DELETE A
                    FROM  envision.donors A,
                          envision.donors B
                    WHERE  A.donorName = B.donorName AND  A.id > B.id`
      db.sequelize.query(sql)
      .then(data => {
        res.json({ success : data})
      })
      .catch(err => {
        console.log("Client Error @ UserFunctions > get_donors" + err)
        res.status(404).send('Err #332 attempted to remove dupes').end()
      })
    } else {
      console.log('+++ not permitted to get use data')
      res.sendStatus(403).end()
    }
  })

  dbadmin.post('/createdb2', (req, res) => {

    // establish that refering url is allowed
    let refer = server.stripDown(req.headers.referer)
    let newDbName = config.global.root_db_name+req.body.newDbName
    if( (refer.includes(pj.global.domain)  && req.session.uuid !== undefined) || pj.global.testmode === 'on') {
      if(req.body.newDbName !== undefined){
        db.sequelize.query(`CREATE DATABASE IF NOT EXISTS ${newDbName} `, {
            type: db.sequelize.QueryTypes.CREATE
          }).then( () => {
            res.json({success: 'Created DB: ' + req.body.newDbName}).end();
          }).catch( err => {
            console.log('++err #300 problem with query => ' + err)
            res.json({ error: 'failed to create new' }).end()
          })
      }
    } else {
      console.log(' ++ did not create database it is undefined')
      res.status(500).send('new database name arrive as undefined').end();
    }
  })

  dbadmin.post('/showdbs2', (req, res) => {
    db.sequelize.query('show databases')
    .then(function(rows) {
        if(rows !== undefined){
            var temp = JSON.stringify(rows)
            var arrOfDbNames = temp.toString().split('"');
            var showDbs = [config.global.root_db_name]
            arrOfDbNames.forEach( (e,i) => {
              if(e !== undefined && e.toString().includes(config.global.root_db_name)){

                //check to see if it is already pushed because getting dupes
                var alreadyPushed = false;
                showDbs.forEach( (e2,i) => {
                  if(e === showDbs[i]) alreadyPushed = true
                })
                if(alreadyPushed === false) showDbs.push(e)
              }
            })
        }
        //console.log(JSON.stringify(rows));
        showDbs.shift();
        res.json(showDbs).end()
    }).catch (err => {
      res.json({ error: 'failed to get databases DbaRoutes.js: ' + err }).end()
    })
  })


  dbadmin.post('/removedb2', (req, res) => {
    db.sequelize.query('DROP SCHEMA IF EXISTS ' + req.body.DBname)
    .then( ()=>  {
        res.json({success: 'db removed'}).end()
    }).catch (err => {
      res.json({ fail: 'db remove failed:'}).end()
      console.log('failed to remove db: ' + err)
    })
  })


  module.exports = dbadmin
