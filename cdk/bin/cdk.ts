#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { EksMultiArchStack } from '../lib/eks-multi-arch-stack';
import { MultiArchPipelineStack } from '../lib/multi-arch-pipeline-stack';

const app = new cdk.App();
const eksMultiArchStack = new EksMultiArchStack(app, 'eks-multi-arch-stack', {
  clusterName: app.node.tryGetContext('app-config/clusterName'),
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
  }
});

new MultiArchPipelineStack(app, 'multi-arch-pipeline-stack', {
  deployRoleArn: eksMultiArchStack.deployRoleArn,
  ecrRepositoryName: app.node.tryGetContext('app-config/ecrRepositoryName'),
  gitHubRepo: app.node.tryGetContext('app-config/gitHubRepo'),
  gitHubRepoBranchName: app.node.tryGetContext('app-config/gitHubRepoBranchName'),
  gitHubRepoOwner: app.node.tryGetContext('app-config/gitHubRepoOwner'),
  gitHubTokenAwsSecretsName: app.node.tryGetContext('app-config/gitHubTokenAwsSecretsName')
});