const AWS = require('aws-sdk');

exports.lambdaHandler = async (event, context) => {
  console.log("Event received by Lambda function: " + JSON.stringify(event, null, 2));
  
  try {
    for (const record of event.Records) {
      const newImage = record.dynamodb.NewImage;
      if (newImage) {
        const count = parseInt(newImage.Count.N);
        if (count === 0) {
          const store = newImage.Store.S;
          const item = newImage.Item.S;
          const message = `${store} is out of stock of ${item}`;
          console.log(message);

          const sns = new AWS.SNS();
          const alertTopic = 'NoStock';
          const snsTopics = await sns.listTopics().promise();
          const snsTopicArn = snsTopics.Topics.find(topic =>
            topic.TopicArn.toLowerCase().endsWith(`:${alertTopic.toLowerCase()}`)
          ).TopicArn;

          await sns.publish({
            TopicArn: snsTopicArn,
            Message: message,
            Subject: 'Inventory Alert!',
            MessageStructure: 'raw'
          }).promise();
        }
      }
    }
    return `Successfully processed ${event.Records.length} records.`;
  } catch (error) {
    console.error("Error processing DynamoDB records:", error);
    throw error;
  }
};
