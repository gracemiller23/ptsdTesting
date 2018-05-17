
// //variables for text analysis functions
var descriptionTextResultsArray =[];
var textAnalysisPercentageResult = 0;
var descriptTextFinalPercent= 0;
var id = "";
var idName ="";
var keyWordsinEntry = [];

////////////////Watson API for Text Analysis//////////////////////////////////////////


var ToneAnalyzerV3 = require('watson-developer-cloud/tone-analyzer/v3');

var toneAnalyzer = new ToneAnalyzerV3({
    version: '2017-09-21',
    url: "https://gateway.watsonplatform.net/tone-analyzer/api",
    username: "2730f67c-5dd6-46fa-8616-1d256917b9f1",
    password: "QsB2qWe1bvDH",
    sentences: false,
    headers: {
        'X-Watson-Learning-Opt-Out': 'true'
    }
  });
  var watsonEmoTotal= 0;
  var watsonDivider = 0;

  
  function watsonTextAnalysis(descriptionText){

    var toneParams = {
    'tone_input': { 'text': descriptionText },
    'content_type': 'application/json'
  };
  
  toneAnalyzer.tone(toneParams, function (error, analysis) {
    if (error) {
      console.log(error);
    } else { 
      console.log(JSON.stringify(analysis, null, 2));
        //targets the correct part of the JSON object that Watson returns
        var docObjAccessor = analysis.document_tone;
        //accesses data returned about the entire document
        accessWatsonObject(docObjAccessor);
        //accesses data returned about individual sentences
        for (var j = 0; j< analysis.sentences_tone.length; j++){
            var sentenceAccessor = analysis.sentences_tone[j];
            accessWatsonObject(sentenceAccessor);
        }

    }
    //averages the returned data to determine overall negative emotion
    var finalWatsonAvg = watsonEmoTotal / watsonDivider;
    //pushes results to text analysis results array
    descriptionTextResultsArray.push(finalWatsonAvg);
    console.log("working" + finalWatsonAvg);
    console.log(watsonEmotionResults);
    //triggers the function that synthesizes data from both Indico and Watson APIs
    descriptionTextResultFxn();
  }); 0;

}

// to access sentence emotions: analysis.sentences_tone[i].tones[i]

function accessWatsonObject(accessVariable){
    //accesses the returned JSON object and looks for any negative emotions
    for (var i = 0; i < accessVariable.tones.length; i++){
        var toneResult = accessVariable.tones[i];
        if (toneResult.score > 0.50 && toneResult.tone_id === "tentative"){
            watsonEmoTotal += toneResult.score;
            watsonDivider ++;

        }else if (toneResult.score > 0.30 && toneResult.tone_id === "fear"){
            watsonEmoTotal += toneResult.score;
            watsonDivider ++;
        }else if (toneResult.score > 0.30 && toneResult.tone_id === "anger"){
            watsonEmoTotal += toneResult.score;
            watsonDivider ++;
        }else if (toneResult.score > 0.30 && toneResult.tone_id === "sadness"){
            watsonEmoTotal += toneResult.score;
            watsonDivider ++;
        }else{
            watsonEmoTotal += 0;
        };
        
    };
    return [watsonEmoTotal, watsonDivider];
};

////////////////Indico API Functions//////////////////////////////////////////////////

// //note to self: replace actual function names with callback in functions, after functions are enacted with correct callback functions

function analyzeDescriptionText(descriptionText) {
   

    //key words that are often present in descriptions of PTSD, factored into analysis to balance the quality of results from the Indico API for this subject matter
    var ptsdKeyWords = ["flashbacks", "night terrors", "nightmares", "bad dreams", "relive", "reliving", "relives", "avoid", "avoiding", "negative", "negativity", "unloving", "insomnia",
        "trouble sleeping", "difficulty sleeping", "distracted", "trouble concentrating", "trouble focusing", "startled", "nervous", "anxious",
        "numb", "numbness", "jumpy", "irritable", "angered", "angry", "panic", "fear", "horror", "guilt", "shame", "depressed", "aggressive", "tense",
        "on edge", "loss of interest", "not interested", "uninterested", "chills", "shaking", "detached", "outbursts", "hopeless", "suicide", "kill",
        "kill myself", "suicidal"];

    //API call and promise function to analyze the user's description of the circumstances for key words that are strongly related
    //to declining mental health; presence of keyword is used to weight overall percentage of negative emotion in final result

    $.post(
        'https://apiv2.indico.io/keywords?version=2',
        JSON.stringify({
            'api_key': "e979df7911ebed695be1d678d77e6ce6",
            'data': descriptionText,
            'threshold': 0.1
        })
    ).then(function (res) {
        //access data in the returned json object
        console.log(res)
        var keyWordObject = JSON.parse(res);
        var keyWordResults = keyWordObject.results;
        //could be its own function testing for keywords

        for (var m = 0; m < ptsdKeyWords.length; m++) {
            var arrayKeyWord = ptsdKeyWords[m];
            for (keyword in keyWordResults) {
                if (keyword == arrayKeyWord) {
                    textAnalysisPercentageResult += 0.10;
                    keyWordsinEntry.push(keyword);
                }
            }
        }

        //need to return these values for use outside this function?
        console.log(textAnalysisPercentageResult);
        descriptionTextResultsArray.push(textAnalysisPercentageResult);
        console.log(keyWordsinEntry);
        textEmotionAnalysis(descriptionText);
    });
}


//API call and promise function to analyze the emotions in the text and capture instances of negative emotions
function textEmotionAnalysis(descriptionText){
    $.post(
        'https://apiv2.indico.io/emotion',
        JSON.stringify({
            'api_key': "e979df7911ebed695be1d678d77e6ce6",
            'data': descriptionText,
            'threshold': 0.25
        })
    ).then(function (res) {
        var textEmotionsObject = JSON.parse(res);
        var textEmotionsResults = textEmotionsObject.results;
        console.log(textEmotionsResults);
        var emotionsInitialResult = 0;
        var divider = 0;
        for (property in textEmotionsResults) {
            var emoNumValue = textEmotionsResults[property];
            if (property === "sadness") {
                emotionsInitialResult += emoNumValue;
                divider++;
            } if (property === "anger") {
                emotionsInitialResult += emoNumValue;
                divider++;

            } if (property === "fear") {
                emotionsInitialResult += emoNumValue;
                divider++;
            }if (property === "joy" || property === "surprise"){
                emotionsInitialResult = 0;
                divider = 1;
            }

        }
        var finalEmotionsAverage = emotionsInitialResult / divider;
        console.log(finalEmotionsAverage);
        descriptionTextResultsArray.push(finalEmotionsAverage);
        console.log(descriptionTextResultsArray);
        //steps analysis on to the Watson API before final results are calculated based on results from both APIs
        watsonTextAnalysis(descriptionText);

    });

}


////////////////////////////////////////////////////////Text Analysis Result Functions/////////////////////////////////////////////
//Synthesizes the average of negative emotions and the weight added by the presence of keywords
function descriptionTextResultFxn(){

for (var i = 0; i < descriptionTextResultsArray.length; i++) {
    descriptTextFinalPercent += descriptionTextResultsArray[i]
}
console.log(descriptTextFinalPercent);
descriptTextFinalPercent = descriptTextFinalPercent * 100;

    if (descriptTextFinalPercent > 100){
        descriptTextFinalPercent = 100;
    }
        console.log(descriptTextFinalPercent);
        overallResultArray.push(descriptTextFinalPercent);
        console.log("result array" + overallResultArray);
        drawResultGraph(descriptTextFinalPercent, id, idName);

}


//for the required description of concerning behaviors
$("#submit-text").on("click", function (event) {
    descriptionTextResultsArray =[];
   textAnalysisPercentageResult = 0;
   descriptTextFinalPercent= 0;
    console.log("clicked")
    var descriptionText = $("#behavior-description").val().trim();
    event.preventDefault();

    id = "#description-result-graph";
    idName = "description-result-graph";
    analyzeDescriptionText(descriptionText);

    $("#behavior-description").val("Submitted.");


});


////for uploaded text that's not required

$("#submit-pasted-text").on("click", function (event) {
    descriptionTextResultsArray =[];
    textAnalysisPercentageResult = 0;
    descriptTextFinalPercent= 0;
    console.log("clicked")
    var descriptionText = $("#pasted-text").val().trim();
    event.preventDefault();
    id = "#text-analysis-graph";
    idName = "text-analysis-graph";

    analyzeDescriptionText(descriptionText);
    $("#pasted-text").val("Submitted.");


});



//////////////////////////////////////added to the main .js file already!!!!!!!!!!!!!!!!!!!!!


//You can use this function as a callback wherever you are calculating the results of your analysis to generate your graph
    //variable = whatever your variable your result is stored in, id = the canvas id for where you want your graph to appear 
    //in "#id" form, and idName = the same id, but in "id" form with out the hashtag

function drawResultGraph(variable, id, idName) {

    console.log("result graph working")
    var remainder = 100 - variable;

    //pass the canvas id name down through arguments instead of using it here
    $(id).attr("data-result-value", variable);

    var ctxD = document.getElementById(idName).getContext('2d');
    var myLineChart = new Chart(ctxD, {
        type: 'doughnut',
        data: {
            labels: ["Concern", "Non-concern"],
            datasets: [
                {
                    data: [variable, remainder],
                    backgroundColor: ["blue", "gray"],
                    hoverBackgroundColor: ["#FF5A5E", "#5AD3D1"]
                }
            ]
        },
        options: {
            responsive: true
        }
    });
}

//////////To calculate group average and print results - Incomplete as of now, but push to the array below in your function//////////////


//push your final average from your section's analysis into this array
var overallResultArray = [];

///function used to calculate an average from assessment, text analysis, and visual analysis to determine the final recommendation
    //but, this percentage is not displayed, so that users can determine the relevance and/or bias of other results more readily
    //based on the content and elements they entered
function calculateRecommendationAverage(){

    for (var k = 0; k< overallResultArray.length; k++){
        overallResultArray += overallResultArray[k];
    };

    overallPercentage = overallResultArray / overallResultArray.length;

    if (overallPercentage > 50){

    }else{

    };

}


