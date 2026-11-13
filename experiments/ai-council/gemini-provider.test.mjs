import test from "node:test";
import assert from "node:assert/strict";
import { generateWithGemini } from "./gemini-provider.mjs";

test("Gemini rejects missing key without API traffic", async () => {
  await assert.rejects(
    generateWithGemini("hello", {apiKey:"",fetchImpl:()=>{throw Error("should not request")}}),
    /GEMINI_API_KEY is not set/
  );
});
test("Gemini emits text and keeps key out of URL, using a fixed domain", async () => {
  let called = 0;
  const fake = async (url,request) => {
    called++;
    assert.equal(url,"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent");
    assert.equal(request.headers["x-goog-api-key"],"TEST_KEY");
    assert.doesNotMatch(url,/TEST_KEY/);
    assert.equal(request.method,"POST");
    assert.deepEqual(JSON.parse(request.body).contents[0].parts,[{text:"Hãy đánh giá sản phẩm."}]);
    return {ok:true,json:async()=>({candidates:[{content:{parts:[{text:"Gợi ý cải tiến thực tế"}]}}]})};
  };
  const reply=await generateWithGemini("Hãy đánh giá sản phẩm.",{apiKey:"TEST_KEY",fetchImpl:fake});
  assert.equal(reply,"Gợi ý cải tiến thực tế");
  assert.equal(called,1);
});
test("Gemini HTTP failure does not leak response or API key", async () => {
  await assert.rejects(generateWithGemini("hello",{
    apiKey:"SECRET_KEY",fetchImpl:async()=>({ok:false,status:429,json:async()=>({error:"SECRET_KEY"})})
  }),e=>e.message.includes("429")&&!e.message.includes("SECRET_KEY"));
});
test("Gemini model identifier cannot rewrite remote endpoint", async () => {
  await assert.rejects(generateWithGemini("hi",{apiKey:"k",model:"https://bad.example"}),/Invalid Gemini model/);
});
