// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createUser } from "./db.js";
import {
  addMessage, createConversation, createTaskRun, getConversation, listApprovals,
  listDomainRecords, listRunEvents, beginConnectorAction, finishConnectorAction,
} from "./agent-db.js";
import { processOneAgentRun } from "./agent-runtime.js";

function user(prefix) {
  const value={id:`${prefix}-${crypto.randomUUID()}`,email:`${prefix}-${crypto.randomUUID()}@example.com`};
  createUser({...value,passwordHash:"unused"}); return value;
}
function output(answer,actions=[]){return {output_text:JSON.stringify({answer,warnings:[],actions}),usage:{input_tokens:10,output_tokens:5}};}
function action(type,title,data){return {type,title,summary:`Review ${title}`,data:{recordType:null,status:null,sourceUrl:null,to:null,subject:null,body:null,start:null,end:null,description:null,details:null,...data}};}

describe("durable agent runtime",()=>{
  it("stores internal agent work and completes the run",async()=>{
    const current=user("learning-runtime"),conversation=createConversation(current.id,"learning");
    addMessage(current.id,conversation.id,"user","Build a TypeScript study plan");
    const run=createTaskRun(current.id,"learning",conversation.id,"Build a plan",{conversationId:conversation.id,message:"Build a TypeScript study plan"});
    const client={responses:{create:async()=>output("I created the first milestone.",[action("record.create","TypeScript foundations",{recordType:"milestone",status:"active",details:"Types, functions, and modules"})])}};
    expect(await processOneAgentRun(client)).toBe(run.runId);
    expect(listDomainRecords(current.id,"learning")[0]).toMatchObject({recordType:"milestone",title:"TypeScript foundations"});
    expect(getConversation(current.id,conversation.id).messages.at(-1).content).toContain("first milestone");
    expect(listRunEvents(current.id).at(-1).type).toBe("completed");
  });

  it("holds external actions for exact-payload approval",async()=>{
    const current=user("career-runtime"),conversation=createConversation(current.id,"career");
    addMessage(current.id,conversation.id,"user","Draft a follow-up");
    const run=createTaskRun(current.id,"career",conversation.id,"Draft follow-up",{conversationId:conversation.id,message:"Draft a follow-up"});
    const client={responses:{create:async()=>output("The draft is ready for review.",[action("gmail.create_draft","Follow up with Acme",{to:"hiring@example.com",subject:"Application follow-up",body:"Hello, I am following up."})])}};
    await processOneAgentRun(client);
    const approval=listApprovals(current.id,"career")[0];
    expect(approval).toMatchObject({runId:run.runId,status:"pending",actionType:"gmail.create_draft"});
    expect(approval.action).toMatchObject({to:"hiring@example.com",subject:"Application follow-up"});
    expect(listRunEvents(current.id).at(-1).type).toBe("awaiting_approval");
  });

  it("fails closed when the model service is unavailable",async()=>{
    const current=user("agent-no-client"),conversation=createConversation(current.id,"learning");
    createTaskRun(current.id,"learning",conversation.id,"Unavailable",{conversationId:conversation.id,message:"Teach me"});
    await processOneAgentRun(null);
    expect(listRunEvents(current.id).at(-1)).toMatchObject({type:"failed",data:{}});
  });

  it("reserves connector actions before execution and blocks ambiguous replays",()=>{
    const current=user("connector-idempotency"),key=`approval:${crypto.randomUUID()}`;
    expect(beginConnectorAction(current.id,null,"google","calendar.create_event",key).state).toBe("ready");
    expect(beginConnectorAction(current.id,null,"google","calendar.create_event",key).state).toBe("ambiguous");
    finishConnectorAction(current.id,key,"failed",null,"http_503");
    expect(beginConnectorAction(current.id,null,"google","calendar.create_event",key).state).toBe("ready");
    finishConnectorAction(current.id,key,"success","provider-event");
    expect(beginConnectorAction(current.id,null,"google","calendar.create_event",key)).toEqual({state:"success",providerRef:"provider-event"});
  });
});
