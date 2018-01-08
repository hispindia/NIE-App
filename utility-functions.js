/**
 * Created by harsh on 7/5/16.
 */


var _ = require('underscore');

_.prepareIdToObjectMap = function(object,id){
    var map = [];
    for (var i=0;i<object.length;i++){
        map[object[i][id]] = object[i];
    }
    return map;
}


_.prepareIdToValueMap = function(object,id,valueKey){
    var map = [];
    for (var i=0;i<object.length;i++){
        map[object[i][id]] = object[i][valueKey];
    }
    return map;
}
_.prepareMapGroupedById= function(object,id){
    var map = [];
    for (var i=0;i<object.length;i++){
        if (!map[object[i][id]]){
            map[object[i][id]] = [];
        }
        map[object[i][id]].push(object[i]);
    }
    return map;
}

_.prepareUID = function(options,ids){
    
    var sha1 = require('js-sha1');
    var sortedIds = ids.sort();
    var uid = sha1(sortedIds.join(";"));

 //   console.log("uid="+uid+","+ids.toString());
    return "C"+uid.substr(0,10);
}

//http://stackoverflow.com/questions/9804777/how-to-test-if-a-string-is-json-or-not
//http://stackoverflow.com/users/3119662/kubosho
_.isJson = function(item) {
    item = typeof item !== "string"
        ? JSON.stringify(item)
        : item;

    try {
        item = JSON.parse(item);
    } catch (e) {
        return false;
    }

    if (typeof item === "object" && item !== null) {
        return true;
    }

    return false;
}

_.shadowStringify= function (json){
    var str = json;
    str = JSON.stringify(str);
    str = str.replace(/\"/g,'^');
    str = str.replace(/{/g,'<');
    str = str.replace(/}/g,'>');
    return str;
}

_.unshadowStringify = function(str){
    str = str.replace(/\^/g,'"');
    str = str.replace(/</g,'{');
    str = str.replace(/>/g,'}');

    return JSON.parse(str);
}

_.findValueAgainstId = function (data,idKey,id,valKey){
    
    for (var i=0;i<data.length;i++){
        if (data[i][idKey]==id){
            return data[i][valKey]
        }
    }
    return null;
    
}


_.reduce = function(list,id,seperator){
    var accumlator = "";
    for (var key in list){
        accumlator = accumlator + list[key][id] + seperator;
    }
    return accumlator;
}

_.getMapLength = function(map){
    var index =0;
    for (var key in map){
        index = index+1;
    }
    
    return index;
}


_.checkListForValue = function (data,idKey,id,valKey,values){
    for (var i=0;i<data.length;i++){
        if (data[i][idKey]==id){
            for (var key in values){
                if (data[i][valKey] == values[key]){
                    return true
                }
            }
        }
    }
    return false;
}



_.getMaxMinFromList = function(list,id){

    var result = {max : null,min:null};

    for (var key in list){
        if (!result.max){result.max = list[key][id]}
        if (!result.min){result.min = list[key][id]}

        if (result.max < list[key][id]){result.max = list[key][id]}
        if (result.min > list[key][id]){result.min = list[key][id]}

    }
    return result;
}

module.exports = _;
