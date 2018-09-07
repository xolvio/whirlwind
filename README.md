# Whirlwind

## Getting Started

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

3. Clone this repo

4. Customize `index.js` and `scenarioProcessor.js` to suit your needs

5. Be sure you are using node version `v8.9.3` (works with `v8.x`)

6. Run `npm install`

7. Export these ENV variables:
```
export INFLUX_HOST=<your ip>
export INFLUX_PASSWORD=<your password>
export INFLUX_USER=<your user>
export INFLUX_DB=<the database>
export TARGET_HOST=<target host>
```

8. We've prepared a repo to show how to use whirlwind: [whirlwind-example](https://github.com/xolvio/whirlwind-example)

## Optional steps:

## Route all Lambda traffic thru 1 IP address
You may want to send all requests from 1 IP address, for example to test a server still in development and not accessible from the most of the internet. With AWS VPC and NAT gateway it's possible to run all Lambda functions in a private subnet and route all the traffic thru a leased IP address, called Elastic IP.

Here is a video how to configure this on AWS side:

[![Setting up Lambdas to use a static IP address](http://img.youtube.com/vi/JcRKdEP94jM/0.jpg)](http://www.youtube.com/watch?v=JcRKdEP94jM "AWS Knowledge Center Videos: How do I use AWS Lambda in a VPC?")

and a tutorial:
[How to setup a VPC for Lambdas](https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Scenario2.html "How to setup a VPC for Lambdas")

Also in serverless.yml you need to setup securityGroupIds and subnetIds, commented example is already in this file. A securityGroup is defined in VPC Dashboard -> Security -> Security Groups, you can use a default security group with all the internet access. SubnetIds are you private subnets in which Lambdas will be generated.

## Setup an EC2 influxDB server for logging test results and errors
We've used a t2.micro instance with Ubuntu 16.04, updated apt-get repo (apt-get update), installed updates (apt-get upgrade) and followed official installation tutorial [Installing influxDB](https://docs.influxdata.com/influxdb/v1.6/introduction/installation/#installing-influxdb-oss "Installing influxDB")

Then you need to setup access to influxDB over the internet by following [this tutorial](https://docs.influxdata.com/influxdb/v1.6/administration/authentication_and_authorization/ "Authentication and authorisation").

Finally you need to open port 5001 (this is a default port for influxDB, you can choose a different port) on your EC2 instance. [Here](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/authorizing-access-to-an-instance.html "Opening port on EC2 for influxDB") is how.

And that's all.

## Graphana
Graphana is a log watcher which can directly connect to influxDB and show your test logs in real-time. It's really easy to use and generates great looking graphs.

We used a Graphana hosted on their servers. It's the option "We Host It" on [this](https://grafana.com/get "Get Graphana") page.

Also [this](http://www.andremiller.net/content/grafana-and-influxdb-quickstart-on-ubuntu "Setting up influxDB") blog shows some usage and installation of influxDB and Graphana hosted on your server.

# TODO
* [x] Move `whirlwind` core NPM package (prepared master for creating a separate package)
* [x] Example repo of using `whirlwind` (on local computer)
* [x] Instructions for Subnets
* [x] Instructions for Influx DB setup
* [x] Instructions for IAM permission
* [x] Instructions for Grafana
* [x] DDOS Attack support
* [x] Rename `LOADTEST_TARGET` to `TARGET_HOST`
