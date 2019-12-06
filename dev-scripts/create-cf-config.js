const aws = require("aws-sdk");
let template={
    "default": {
        "StackName": "mouro-ecs-branch",
        "TemplateBody": "./aws-cfn/mouro.yml",
        "Parameters": {
            "StageName": "branch",
            "VPC": "vpc-0cbf8ecfd8d6de6ce",
            "SubnetA": "subnet-02970b22ce9b45a59",
            "SubnetB": "subnet-0a735e7e1a4846216",
            "Certificate": "arn:aws:acm:us-west-2:113196216558:certificate/b90939e6-2cb3-4944-a6da-c7d0ea6fa185",
            "ServiceName": "mouro-ecs-branch",
            "MinContainers": "1",
            "MaxContainers": "1",
            "AutoScalingTargetValue": "100",
            "EnvPgUrl": "PG_URL",
            "EnvInfuraProjectId": "INFURA_PROJECT_ID",
            "EnvDebug": "mouro:*",
            "EnvSerial": "2"
        },
        "Capabilities": [
            "CAPABILITY_NAMED_IAM"
        ]
    }
}

const branch=process.argv[2]
const serial=(new Date()).getTime();

const ssmClient=new aws.SSM();
async function getSSMParameter(param){
    const params = {
        Name: param,
        WithDecryption: true
    };
    
    const ssmParam = await ssmClient.getParameter(params).promise();
    return ssmParam.Parameter.Value;
}


const f=(async()=>{
    template.default.StackName="mouro-ecs-"+branch;
    template.default.Parameters.StageName=branch;
    template.default.Parameters.ServiceName="mouro-ecs-"+branch;
    template.default.Parameters.EnvSerial=""+serial;

    if(branch=="master"){
        template.default.Parameters.VPC="vpc-0749b50b0cd756a06"
        template.default.Parameters.SubnetA="subnet-0754c5a9c71160829"
        template.default.Parameters.SubnetB="subnet-02cf5c1fd9c86a117"
        template.default.Parameters.Certificate="arn:aws:acm:us-west-2:113196216558:certificate/b2c6974a-d0a9-4769-8963-628054f042a1"
        template.default.Parameters.EnvPgUrl=await getSSMParameter("/mouro/master/PG_URL")
        template.default.Parameters.EnvInfuraProjectId=await getSSMParameter("/mouro/master/INFURA_PROJECT_ID")
    }else{
        template.default.Parameters.EnvPgUrl=await getSSMParameter("/mouro/develop/PG_URL")
        template.default.Parameters.EnvInfuraProjectId=await getSSMParameter("/mouro/develop/INFURA_PROJECT_ID")
    }

    //Env Vars
    console.log(JSON.stringify(template,null,3));
})();

