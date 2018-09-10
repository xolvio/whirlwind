# ![Whirlwind Logo](./images/whirlwind.svg?sanitize=true) <br/>Whirlwind
 
Whirlwind is a performance testing library that allows you to run the following higher order functions:

* Load
* Spike
* Stress
* Soak
* DDOS

Whirlwind uses the AWESOME [Artillery.io](https://artillery.io) toolkit and runs on Serverless Framework and on Amazon Lambda, allowing you to generate an insane amount of load. You can even simulate a DDOS attack by distributing the load across the globe! 

For an example of how to use this, please see the [whirlwind-example](https://github.com/xolvio/whirlwind-example) repository.

## Setup

1. Set permission policy for an IAM user with the following config:

```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": [
                "cloudformation:ListStacks",
                "cloudformation:CreateStack",
                "cloudformation:UpdateStack",
                "cloudformation:CreateChangeSet",
                "cloudformation:DescribeChangeSet",
                "cloudformation:ExecuteChangeSet",
                "cloudformation:DescribeStacks",
                "cloudformation:DescribeStackEvents",
                "cloudformation:DescribeStackResource",
                "s3:createBucket",
                "lambda:InvokeFunction",
                "s3:GetObject",
                "s3:PutObject",
                "s3:ListBucket",
                "cloudformation:ValidateTemplate",
                "iam:GetRole",
                "logs:DescribeLogGroups",
                "iam:CreateRole",
                "logs:CreateLogGroup",
                "iam:DeleteRole",
                "iam:PutRolePolicy",
                "lambda:GetFunction",
                "lambda:CreateFunction",
                "iam:PassRole",
                "lambda:ListVersionsByFunction",
                "lambda:PublishVersion",
                "lambda:UpdateFunctionCode",
                "lambda:UpdateFunctionConfiguration",
                "iam:AttachRolePolicy",
                "cloudformation:DeleteStack",
                "lambda:DeleteFunction",
                "logs:DescribeLogStreams",
                "logs:DeleteLogGroup",
                "s3:DeleteBucket"
            ],
            "Resource": "*"
        }
    ]
}
```

2. Create an `~/.aws/credentials` file with:
```
[default]
aws_access_key_id=KEY
aws_secret_access_key=KEY
```

3. Make sure you have Node installed (tested with Node `v8.9.3` and may work with higher).

4. Export these ENV variables:
```
export INFLUX_HOST=<your ip>
export INFLUX_PASSWORD=<your password>
export INFLUX_USER=<your user>
export INFLUX_DB=<the database>
export TARGET_HOST=<target host>
```

## Optional steps:

## Route all Lambda traffic through 1 IP address
You may want to send all requests from 1 IP address, for example to test a server may still be in development and not accessible from Internet. With AWS VPC and NAT gateway it's possible to run all Lambda functions in a private subnet and route all the traffic through a leased IP address.

Here is a video how to configure this on AWS side:

[![Setting up Lambdas to use a static IP address](http://img.youtube.com/vi/JcRKdEP94jM/0.jpg)](http://www.youtube.com/watch?v=JcRKdEP94jM "AWS Knowledge Center Videos: How do I use AWS Lambda in a VPC?")

and a tutorial:
[How to setup a VPC for Lambdas](https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Scenario2.html "How to setup a VPC for Lambdas")

You also need to setup `securityGroupIds` and `subnetIds` in your `serverless.yml` file. You can see a commented example in the file in this repo. A `securityGroup` is defined in VPC Dashboard -> Security -> Security Groups, you can use a default security group with open internet access. 

## Setup an EC2 influxDB server for logging test results and errors
You can install InfluxDB on a `t2.micro` (or higher) instance with Ubuntu 16.04. First run `apt-get update` and `apt-get upgrade` then follow official installation tutorial [Installing influxDB](https://docs.influxdata.com/influxdb/v1.6/introduction/installation/#installing-influxdb-oss "Installing influxDB")

You then need to setup access to influxDB over the internet by following [this tutorial](https://docs.influxdata.com/influxdb/v1.6/administration/authentication_and_authorization/ "Authentication and authorisation").

Finally you need to open port `5001` (this is a default port for influxDB, you can choose a different port) on your EC2 instance. [Here](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/authorizing-access-to-an-instance.html "Opening port on EC2 for influxDB") is how.

## Graphana
Graphana is a log watcher which can directly connect to influxDB and show your test logs in real-time. It's really easy to use and generates great looking graphs.

We used Graphana hosted on their servers. This is the "We Host It" option that [you can see on this page](https://grafana.com/get "Get Graphana").

Also [this](http://www.andremiller.net/content/grafana-and-influxdb-quickstart-on-ubuntu "Setting up influxDB") blog shows some usage and installation of influxDB and Graphana hosted on your server.

#### Credits

This project has been forked from the awesome [serverless-artillery](https://github.com/Nordstrom/serverless-artillery) project. A huge thank you goes to the Nordstorm team for making this OSS and allowing us to build Whirlwind on top of their hard work.

 
