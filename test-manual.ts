import { submitContactInquiry } from './src/actions/contact';

async function test() {
  const result = await submitContactInquiry({
    name: "!",
    email: "!a@test-property-a.aa",
    company: undefined,
    message: "!"
  });
  
  console.log('Result:', JSON.stringify(result, null, 2));
}

test().catch(console.error);
