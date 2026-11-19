#!/usr/bin/env python3
"""Fail-closed cleanup: delete only ref tips already reachable from dev or main."""
import json, os, time
from urllib.request import Request, urlopen
from urllib.parse import quote, urlencode
from urllib.error import HTTPError

repo = "RosevearCreations/rosevear-comms-hub"
token = os.environ.get("GITHUB_TOKEN","")
BASE = "https://api.github.com/repos/" + repo
keep = {"dev","main"}

def call(method,path):
    req = Request(BASE+path,method=method,headers={
      "Accept":"application/vnd.github+json",
      "X-GitHub-Api-Version":"2022-11-28",
      "Authorization":"Bearer "+token,
      "User-Agent":"Rosevear-CommsHub-branch-cleanup"})
    try:
        with urlopen(req,timeout=45) as res:
            data=res.read()
            return json.loads(data) if data else None
    except HTTPError as e:
        raise RuntimeError(f"{method} {path}: GitHub {e.code} {e.read(300)!r}") from e

def branch(name):
    return call("GET","/branches/"+quote(name,safe=""))
def compare(base,name):
    j=call("GET","/compare/"+quote(base,safe="")+"..."+quote(name,safe=""))
    if not isinstance(j.get("ahead_by"),int):
        raise RuntimeError("Missing ahead_by from comparison")
    return j["ahead_by"]
def heads():
    return {name:branch(name)["commit"]["sha"] for name in keep}
def opens(name):
    p=urlencode({"state":"open","head":"RosevearCreations:"+name,"per_page":1})
    v=call("GET","/pulls?"+p)
    if not isinstance(v,list):raise RuntimeError("Invalid PR API response")
    return bool(v)
def inventory():
    result=[]
    for page in range(1,22):
        part=call("GET",f"/branches?per_page=100&page={page}")
        if not isinstance(part,list):raise RuntimeError("Invalid branch page")
        result.extend(part)
        if len(result)>2000:raise RuntimeError("Unexpected branch count")
        if len(part)<100:return result
    raise RuntimeError("Branch listing not exhausted")

if not (os.environ.get("GITHUB_REPOSITORY")==repo and
        os.environ.get("GITHUB_EVENT_NAME")=="push" and
        os.environ.get("GITHUB_REF")=="refs/heads/main" and
        len(os.environ.get("GITHUB_SHA",""))==40 and token):
    raise RuntimeError("Not an authenticated original-main push")
base_heads=heads()
if base_heads["main"]!=os.environ["GITHUB_SHA"]:
    raise RuntimeError("Main advanced after workflow trigger")
all_branches=inventory()
names=[x["name"] for x in all_branches]
if len(names)!=len(set(names)) or not keep.issubset(names):
    raise RuntimeError("Branch inventory inconsistent")
deleted, held, errors=[],[],[]
print(f"Starting verified cleanup of {len(names)} refs",flush=True)
for b in all_branches:
    n=b["name"]
    if n in keep:continue
    if b.get("protected") is True:
        held.append((n,"protected branch"));continue
    try:
        left,right=compare("main",n),compare("dev",n)
        if left!=0 and right!=0:
            held.append((n,f"unique commits: ahead main {left}; ahead dev {right}"))
            continue
        if heads()!=base_heads:raise RuntimeError("Protected ref advanced: abort")
        refreshed=branch(n)
        if refreshed.get("protected") or refreshed["commit"]["sha"]!=b["commit"]["sha"]:
            held.append((n,"ref moved or protected"));continue
        if opens(n):
            held.append((n,"open PR"));continue
        if compare("main",n)!=0 and compare("dev",n)!=0:
            held.append((n,"ancestry changed"));continue
        if heads()!=base_heads:raise RuntimeError("Protected refs moved")
        call("DELETE","/git/refs/heads/"+quote(n,safe="/"))
        deleted.append(n)
        print("DELETED "+n,flush=True)
    except Exception as exc:
        errors.append((n,str(exc)))
        print("HELD ERROR "+n+": "+str(exc),flush=True)
        if "Protected ref" in str(exc):break
    time.sleep(0.05)
lines=["# Rosevear Comms Hub guarded branch cleanup",
 f"Deleted branches: {len(deleted)}",
 f"Preserved branches with unique commits/protection: {len(held)}",
 f"Undeleted branches with errors: {len(errors)}",
 "Protected dev and main were never deletion candidates.",
 "", "## Preserved"]
lines += [f"- {n}: {why}" for n,why in held]
lines += ["", "## Errors"]+[f"- {n}: {why}" for n,why in errors]
lines += ["", "## Deleted"]+[f"- {n}" for n in deleted]
with open(os.environ["GITHUB_STEP_SUMMARY"],"a",encoding="utf8") as f:
    f.write("\n".join(lines)+"\n")
print(json.dumps({"deleted":len(deleted),"held":len(held),"errors":len(errors),
 "held_refs":held,"error_refs":errors},indent=2),flush=True)
if errors:raise RuntimeError("Unresolved GitHub cleanup errors")
