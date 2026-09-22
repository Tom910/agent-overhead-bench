package auth

import (
 "context"
 "testing"
 cliproxyexecutor "github.com/router-for-me/CLIProxyAPI/v7/sdk/cliproxy/executor"
)

func TestCharacterizeZeroRetryStillReplaysAfter401(t *testing.T) {
 m, executor, primary, backup, model := newUnauthorizedRefreshFixture(t, false)
 m.Remove(context.Background(), backup.ID)
 m.SetRetryConfig(0, 0, 1)
 _, err := m.Execute(context.Background(), []string{"codex"}, cliproxyexecutor.Request{Model:model}, cliproxyexecutor.Options{})
 if err!=nil {t.Fatal(err)}
 if got:=executor.ExecuteCalls(); len(got)!=2 || got[0]!=primary.ID || got[1]!=primary.ID {t.Fatalf("expected two attempts to one credential, got %v",got)}
 if got:=executor.RefreshCalls();got!=1 {t.Fatalf("refresh calls %d",got)}
 t.Log("Confirmed: request-retry=0, max-retry-credentials=1, one credential still permits 401 refresh and model request replay")
}
