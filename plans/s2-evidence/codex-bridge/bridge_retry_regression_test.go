package auth

import (
 "context"
 "testing"
 cliproxyexecutor "github.com/router-for-me/CLIProxyAPI/v7/sdk/cliproxy/executor"
)

func TestAOBNoUnauthorizedReplayAtEffectiveZero(t *testing.T) {
 for _,stream:=range []bool{false,true} {
  for _,tc:=range []struct{name string; global int; override *int; wantReplay bool; legacy bool}{
   {name:"global-zero",global:0},
   {name:"credential-zero",global:1,override:intPointer(0)},
   {name:"global-positive",global:1,wantReplay:true},
   {name:"credential-positive",global:0,override:intPointer(1),wantReplay:true},
   {name:"legacy-zero-without-opt-in",global:0,wantReplay:true,legacy:true},
  } {
   mode:="nonstream/";if stream{mode="stream/"}
   t.Run(mode+tc.name,func(t *testing.T){
    m,executor,primary,backup,model:=newUnauthorizedRefreshFixture(t,false)
    m.Remove(context.Background(),backup.ID)
    m.SetRetryConfig(tc.global,0,1)
    primary.Metadata["aob_disable_unauthorized_replay"]=!tc.legacy
    if tc.override!=nil {primary.Metadata["request_retry"]=*tc.override}
    if _,err:=m.Register(context.Background(),primary);err!=nil{t.Fatal(err)}
    var err error
    if stream {
     var result *cliproxyexecutor.StreamResult
     result,err=m.ExecuteStream(context.Background(),[]string{"codex"},cliproxyexecutor.Request{Model:model},cliproxyexecutor.Options{Stream:true})
     if result!=nil {for chunk:=range result.Chunks{if chunk.Err!=nil{err=chunk.Err}}}
    } else {_,err=m.Execute(context.Background(),[]string{"codex"},cliproxyexecutor.Request{Model:model},cliproxyexecutor.Options{})}
    wantCalls,wantRefresh:=1,0
    if tc.wantReplay {wantCalls,wantRefresh=2,1;if err!=nil{t.Fatal(err)}} else if err==nil{t.Fatal("expected original 401, got success after hidden replay")}
    calls:=executor.ExecuteCalls();if stream{calls=executor.StreamCalls()}
    if len(calls)!=wantCalls || executor.RefreshCalls()!=wantRefresh {t.Fatalf("calls=%v refresh=%d want attempts=%d refresh=%d",calls,executor.RefreshCalls(),wantCalls,wantRefresh)}
   })
  }
 }
}

func intPointer(v int)*int{return &v}
