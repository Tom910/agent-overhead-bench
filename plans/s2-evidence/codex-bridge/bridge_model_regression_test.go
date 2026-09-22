package chat_completions

import (
 "context"
 "testing"
 "github.com/tidwall/gjson"
)

func TestAOBTerminalModelIdentity(t *testing.T) {
 for _,terminalType:=range []string{"response.completed","response.incomplete"} {
  t.Run(terminalType,func(t *testing.T){
   for _,createdModel:=range []string{"gpt-6-luna",""} {
    var state any
    ConvertCodexResponseToOpenAI(context.Background(),"gpt-6-luna",nil,nil,[]byte(`data: {"type":"response.created","response":{"model":"`+createdModel+`"}}`),&state)
    out:=ConvertCodexResponseToOpenAI(context.Background(),"gpt-6-luna",nil,nil,[]byte(`data: {"type":"`+terminalType+`","response":{"model":"unexpected-model","output":[],"usage":{"input_tokens":1,"output_tokens":2,"total_tokens":3}}}`),&state)
    if len(out)!=1 {t.Fatalf("chunks=%d",len(out))}
    if got:=gjson.GetBytes(out[0],"model").String();got!="unexpected-model" {t.Fatalf("terminal served model hidden: got %q",got)}
   }
  })
 }
}
