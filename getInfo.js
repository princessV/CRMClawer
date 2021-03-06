'use strict'

let request = require('request');
let XLSXparser = require('./XLSXparser.js');

let PropertiesReader = require('properties-reader');
let properties = PropertiesReader('properties.file');

let parser = new XLSXparser();

let jsdom = require('jsdom').jsdom;
let doc = jsdom();
let window = doc.defaultView;
let $ = require('jquery')(window)

let async = require("async");

let dataparser = require('./dataparser.js');

let data = [];

getBasicInfo();


function getBasicInfo() {
    // let data = [["姓名", "电话", "学校" , "专业", "申请学历", "意向专业", "在读年级", "基本情况", "最近回访内容", "渠道"]]
    let options = {
        method: 'GET',
        url: properties.get('baseUrl.overall') + '?page=1&rows=100',
        headers: {
            'Authorization': properties.get('auth.basic')
        }
    };
    console.log("Calling " + options.url);

    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            let json_body = JSON.parse(body);
            json_body.rows.forEach(function (stu) {
                let name = stu.customer.name;
                let phone_number = '';
                let currSchool = stu.currSchool;
                let currSpecialty = stu.currentSpecialty;
                let planXl = stu.planXl;
                let planCountry = stu.planCountry;
                let hopeSpecialty = stu.hopeSpecialty;
                let currGrade = stu.currGrade;
                let basicInfo = '';
                let lastContactRecords = '';
                let level = stu.stuLevelName;
                stu.lastContactRecords.forEach(function (contactRecord) {
                    lastContactRecords += (contactRecord.contactText + '\n' + '------' + '\n');
                })
                let stuFromName = stu.stuFromName;
                let stuid = stu.id;

                data.push([name, phone_number, currSchool, currSpecialty, planXl, hopeSpecialty, planCountry, currGrade, basicInfo, lastContactRecords, stuFromName, level, stuid]);
            });

            getFutherInfo();


        } else {
            console.log('error')
        }
    })
}

function getFutherInfo() {


    async.forEachSeries(data, function (index, callback) {
        let id = index[12];

        let options = {
            uri: properties.get('baseUrl.detail') + '?id=' + id,
            headers: {
                'Authorization': properties.get('auth.basic')
            }
        }

        setTimeout(function () {
            console.log("Calling " + options.uri);
            request(options, function (error, response, body) {
                if (!error && response.statusCode == 200) {

                    let html = $(body);
                    let phone = html.find('input[name="mobile"]').val();
                    let basicInfo = html.find('#areaBasicInfo').val();
                    index[1] = phone;
                    index[8] = basicInfo;
                    dataparser.insert(index, callback);
                } else {
                    console.log(response.statusCode + '\t' + error + '\t' + id);
                    callback(error);
                }

                // callback(null);
            });
        }, 100);



    }, function (error) {
        if (error) return error;
        parser.create(data);
        console.log(data.length);
    })
}


