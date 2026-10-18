import React, { useRef, useState } from "react";
import { Text, View } from "react-native";
import { Body, Button, Field, Notice } from "@/components/ui";
import { api, type MiraProposal } from "@/lib/api";
import type { StorefrontDraft } from "@/lib/storefront-draft";
import { space, radius, type, useColors } from "@/lib/theme";

export function MiraPanel({storeId,draft,disabled,onUse}:{storeId:string;draft:StorefrontDraft;disabled:boolean;onUse:(patch:MiraProposal["patch"])=>void}) {
  const c=useColors();
  const [open,setOpen]=useState(false),[message,setMessage]=useState("");
  const [history,setHistory]=useState<{role:string;text:string}[]>([]);
  const [proposal,setProposal]=useState<MiraProposal|null>(null);
  const [busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null),[applied,setApplied]=useState(false);
  const lock=useRef(false);
  async function ask() {
    if (lock.current || disabled || message.trim().length<4) return;
    lock.current=true;setBusy(true);setError(null);setApplied(false);setProposal(null);
    const revision=api.storeRevision();
    try {
      const result=await api.mira({message,draft,history},storeId);
      if(revision!==api.storeRevision())return;
      setProposal(result);setHistory([...history,{role:"user",text:message},{role:"assistant",text:result.reply}].slice(-6));setMessage("");
    } catch(e) {setError(e instanceof Error?e.message:"Mira couldn't respond. Try again.");}
    finally {lock.current=false;setBusy(false);}
  }
  return <View style={{backgroundColor:c.surface,borderColor:c.line,borderWidth:1,borderRadius:radius.lg,padding:space.md,gap:space.sm}}>
    <Text style={[type.heading,{color:c.ink}]}>Mira · Your store stylist</Text>
    <Body muted>Find your look. Refine your words. Make it yours.</Body>
    <Button label={open?"Hide Mira":"Ask Mira for design help"} variant="secondary" onPress={()=>setOpen(!open)} />
    {open ? <>
      {!proposal ? <Body muted>Try “Give my cooking store a warm editorial look” or “Help me choose photos for a premium finance store.”</Body>:null}
      {proposal ? <>
        <Body>{proposal.reply}</Body>
        {proposal.photo_tip ? <Body muted>{proposal.photo_tip}</Body>:null}
        {Object.entries(proposal.patch).map(([key,value])=><Text key={key} style={[type.small,{color:c.ink}]}>{key.replace(/_/g," ")}: {value}</Text>)}
        {Object.keys(proposal.patch).length ? <Button label={applied?"Added to your design draft":"Use these suggestions in my draft"} disabled={disabled||busy||applied} onPress={()=>{onUse(proposal.patch);setApplied(true);}} />:null}
      </>:null}
      <Field label="What would you like to improve?" value={message} onChangeText={setMessage} multiline maxLength={1600} placeholder="My audience is… I want the store to feel…" />
      <Button label={proposal?"Ask a follow-up":"Ask Mira"} loading={busy} disabled={disabled||message.trim().length<4} onPress={ask} />
      <Body muted>Uses one assistant request from your plan. Suggestions stay in your draft until you finish and save your store design.</Body>
      <Notice text={error} tone="error" />
    </>:null}
  </View>;
}
