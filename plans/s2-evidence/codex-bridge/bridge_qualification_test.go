package qualification

import (
 "context"
 "testing"
 chat "github.com/router-for-me/CLIProxyAPI/v7/internal/translator/codex/openai/chat-completions"
 responses "github.com/router-for-me/CLIProxyAPI/v7/internal/translator/codex/openai/responses"
 "github.com/tidwall/gjson"
)

const luna = "gpt-6-luna"

// These assertions characterize the pinned bridge, including defects. They are
// not acceptance tests claiming parity or native harness compatibility.
func TestCharacterizeLunaChatUsageAndMissingUsage(t *testing.T) {
 for _, terminal := range []string{
  `{"type":"response.completed","response":{"model":"gpt-6-luna","output":[],"usage":{"input_tokens":41,"output_tokens":17,"total_tokens":58,"input_tokens_details":{"cached_tokens":23,"cache_write_tokens":7},"output_tokens_details":{"reasoning_tokens":11}}}}`,
  `{"type":"response.completed","response":{"model":"gpt-6-luna","output":[]}}`,
 } {
  var state any
  out := chat.ConvertCodexResponseToOpenAI(context.Background(), luna, nil, nil, []byte("data: "+terminal), &state)
  if len(out)!=1 { t.Fatalf("terminal chunks %d",len(out)) }
  nonstream := chat.ConvertCodexResponseToOpenAINonStream(context.Background(),luna,nil,nil,[]byte(terminal),nil)
  for _, converted := range [][]byte{out[0],nonstream} {
   if !gjson.Get(terminal,"response.usage").Exists() {
    if gjson.GetBytes(converted,"usage").Exists() { t.Fatal("missing usage fabricated") }; continue
   }
   for path,want := range map[string]int64{"usage.prompt_tokens":41,"usage.completion_tokens":17,"usage.total_tokens":58,"usage.prompt_tokens_details.cached_tokens":23,"usage.prompt_tokens_details.cache_write_tokens":7,"usage.completion_tokens_details.reasoning_tokens":11} {
    if got:=gjson.GetBytes(converted,path).Int();got!=want { t.Fatalf("%s got %d want %d",path,got,want) }
   }
  }
 }
}

func TestCharacterizeLunaChatEffectiveSettingsAndHistory(t *testing.T) {
 raw:=[]byte(`{"model":"gpt-6-luna","parallel_tool_calls":false,"max_completion_tokens":99,"temperature":0.1,"messages":[{"role":"user","content":"Inspect"},{"role":"assistant","reasoning_content":"summary","reasoning_details":[{"type":"reasoning.encrypted","data":"encrypted-fixture"}],"tool_calls":[{"id":"call-1","type":"function","function":{"name":"read","arguments":"{}"}}]},{"role":"tool","tool_call_id":"call-1","content":"done"}]}`)
 out:=chat.ConvertOpenAIRequestToCodex(luna,raw,true)
 if gjson.GetBytes(out,"model").String()!=luna {t.Fatal("model changed")}
 if gjson.GetBytes(out,"reasoning.effort").String()!="medium" {t.Fatal("default effort changed")}
 if !gjson.GetBytes(out,"parallel_tool_calls").Bool() {t.Fatal("parallel override changed")}
 if gjson.GetBytes(out,"max_output_tokens").Exists() || gjson.GetBytes(out,"temperature").Exists() {t.Fatal("parameter stripping changed")}
 var calls,results,reasoning int
 for _,item:=range gjson.GetBytes(out,"input").Array() {
  switch item.Get("type").String(){case "function_call":calls++;case "function_call_output":results++;case "reasoning":reasoning++}
 }
 if calls!=1 || results!=1 {t.Fatalf("tool roundtrip calls=%d results=%d",calls,results)}
 if reasoning!=0 {t.Fatal("reasoning replay behavior changed; reassess qualification")}
}

func TestCharacterizeLunaTerminalModelMismatchHiddenInChat(t *testing.T) {
 var state any
 chat.ConvertCodexResponseToOpenAI(context.Background(),luna,nil,nil,[]byte(`data: {"type":"response.created","response":{"id":"fixture","model":"gpt-6-luna"}}`),&state)
 terminal:=[]byte(`data: {"type":"response.completed","response":{"model":"unexpected-model","output":[],"usage":{"input_tokens":1,"output_tokens":2,"total_tokens":3}}}`)
 out:=chat.ConvertCodexResponseToOpenAI(context.Background(),luna,nil,nil,terminal,&state)
 if got:=gjson.GetBytes(out[0],"model").String();got!=luna {t.Fatalf("known mismatch behavior changed: %s",got)}
 var nativeState any
 native:=responses.ConvertCodexResponseToOpenAIResponses(context.Background(),luna,nil,nil,terminal,&nativeState)
 if got:=gjson.GetBytes(native[0][6:],"response.model").String();got!="unexpected-model" {t.Fatalf("native model missing: %s",got)}
 t.Log("Confirmed: Chat outward model masks terminal mismatch; raw Responses preserves it")
}

func TestCharacterizeLunaEncryptedReasoningOutputLoss(t *testing.T) {
 terminal:=[]byte(`{"type":"response.completed","response":{"model":"gpt-6-luna","output":[{"type":"reasoning","id":"r1","encrypted_content":"encrypted-fixture","summary":[{"type":"summary_text","text":"visible summary"}]}]}}`)
 chatOut:=chat.ConvertCodexResponseToOpenAINonStream(context.Background(),luna,nil,nil,terminal,nil)
 if gjson.GetBytes(chatOut,"choices.0.message.reasoning_content").String()!="visible summary" {t.Fatal("summary missing")}
 if gjson.GetBytes(chatOut,"choices.0.message.reasoning_details").Exists() {t.Fatal("encrypted reasoning behavior changed")}
 native:=responses.ConvertCodexResponseToOpenAIResponsesNonStream(context.Background(),luna,nil,nil,terminal,nil)
 if gjson.GetBytes(native,"output.0.encrypted_content").String()!="encrypted-fixture" {t.Fatal("native encryption lost")}
}
