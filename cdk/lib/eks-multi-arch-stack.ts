import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as blueprints from '@aws-quickstart/eks-blueprints';
import * as ec2 from '@aws-quickstart/eks-blueprints/node_modules/aws-cdk-lib/aws-ec2';
import * as eks from '@aws-quickstart/eks-blueprints/node_modules/aws-cdk-lib/aws-eks';
import * as iam from '@aws-quickstart/eks-blueprints/node_modules/aws-cdk-lib/aws-iam';

export interface EksMultiArchStackProps extends cdk.StackProps {
  clusterName: string
}

export class EksMultiArchStack extends cdk.Stack {
  public deployRoleArn: string;

  constructor(scope: Construct, id: string, props: EksMultiArchStackProps) {
    super(scope, id, props);

    var addOns: Array<blueprints.ClusterAddOn> = [
      new blueprints.addons.AwsLoadBalancerControllerAddOn(),
      new blueprints.addons.VpcCniAddOn(),
      new blueprints.addons.CoreDnsAddOn(),
      new blueprints.addons.KubeProxyAddOn('v1.26.2-eksbuild.1')
    ]

    const clusterProvider = new blueprints.GenericClusterProvider({
      version: eks.KubernetesVersion.V1_26,
      managedNodeGroups: [
        {
          id: 'x86-onde-large-mng',
          nodegroupName: 'x86-onde-large-mng',
          desiredSize: 1,
          minSize: 1,
          maxSize: 10,
          diskSize: 50,
          instanceTypes: [ new ec2.InstanceType('m5.large') ],
          nodeGroupCapacityType: eks.CapacityType.ON_DEMAND
        },
        {
          id: 'arm-onde-large-mng',
          nodegroupName: 'arm-onde-large-mng',
          desiredSize: 1,
          minSize: 1,
          maxSize: 10,
          diskSize: 50,
          instanceTypes: [ new ec2.InstanceType('m6g.large') ],
          nodeGroupCapacityType: eks.CapacityType.ON_DEMAND,
          taints: [ {
            effect: eks.TaintEffect.NO_EXECUTE,
            key: 'graviton',
            value: 'true'
          } ]
        }
      ]
    });

    const deployRole = new iam.Role(this, 'deploy-iam-role', {
      roleName: `${id}-deployrole`,
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
      description: 'IAM Role for Deployment into EKS Cluster',
      inlinePolicies: {
        'allow-eks-access': iam.PolicyDocument.fromJson({
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Action": [
                  "eks:DescribeCluster"
              ],
              "Resource": "*"
            }
          ]
        })
      }
    });
    this.deployRoleArn = deployRole.roleArn;
    
    const eksCluster = blueprints.EksBlueprint.builder()
      .account(props.env?.account)
      .region(props.env?.region)
      .clusterProvider(clusterProvider)
      .addOns(...addOns)
      .teams(new blueprints.PlatformTeam({
        name: 'cd-deploy-team',
        userRoleArn: deployRole.roleArn
      }))
      .build(scope, `${id}-eksblueprints`);
  }
}