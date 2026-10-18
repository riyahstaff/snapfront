import React, { useCallback, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Body, Button, Field, H1, H2, Notice, Screen, Segmented } from "@/components/ui";
import { account } from "@/lib/account-store";
import { api, money, type Product, type StoreSubscription } from "@/lib/api";
import { radius, space, type, useColors } from "@/lib/theme";

export default function StoreOffers() {
  const c=useColors(),params=useLocalSearchParams<{id?:string}>();
  const [storeId,setStoreId]=useState("");
  const [products,setProducts]=useState<Product[]>([]),[subscribers,setSubscribers]=useState<StoreSubscription[]>([]);
  const [id,setId]=useState<string|undefined>(),[title,setTitle]=useState(""),[description,setDescription]=useState(""),[price,setPrice]=useState("");
  const [billing,setBilling]=useState("once"),[selected,setSelected]=useState<string[]>([]);
  const [busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState<string|null>(null),[notice,setNotice]=useState<string|null>(null);
  const revision=useRef(0),lock=useRef(false),loadedStore=useRef("");
  function edit(p:Product) {setId(p.id);setTitle(p.title);setDescription(p.description);setPrice(String(p.price));setBilling(p.billing_interval||"once");setSelected(p.bundle_product_ids||[]);setNotice(null);setError(null);}
  useFocusEffect(useCallback(()=>{
    let alive=true;const v=++revision.current;setLoading(true);
    (async()=>{
      try {
        const me=await account.refresh();
        const [items,subs]=await Promise.all([api.products(me.id),api.storeSubscriptions(me.id)]);
        if(!alive||v!==revision.current)return;
        if(loadedStore.current!==me.id){setId(undefined);setTitle("");setDescription("");setPrice("");setSelected([]);setBilling("once");setNotice(null);loadedStore.current=me.id;}
        setError(null);setStoreId(me.id);setProducts(items);setSubscribers(subs);
        const p=items.find((p)=>p.id===params.id&&p.bundle_product_ids?.length);if(p)edit(p);
      } catch(e){if(alive)setError(e instanceof Error?e.message:"Couldn't load your products.");}
      finally{if(alive)setLoading(false);}
    })();return()=>{alive=false;};
  },[params.id]));
  const eligible=products.filter((p)=>p.kind==="digital"&&!p.bundle_product_ids?.length&&!p.billing_interval);
  const chosen=eligible.filter((p)=>selected.includes(p.id));
  const regular=chosen.reduce((sum,p)=>sum+p.price,0),amount=Number(price);
  const valid=title.trim().length>0&&Number.isFinite(amount)&&amount>=.5&&selected.length>=(billing==="once"?2:1);
  async function save() {
    if(lock.current||!valid||!storeId)return;
    lock.current=true;setBusy(true);setError(null);const v=api.storeRevision();
    try{
      const p=await api.saveStoreOffer({title,description,price:amount,product_ids:selected,billing_interval:billing==="month"?"month":billing==="year"?"year":null},storeId,id);
      if(v!==api.storeRevision())return;
      setProducts((prev)=>[p,...prev.filter((x)=>x.id!==p.id)]);setId(p.id);
      setNotice(p.status==="live"?"Offer updated for new purchases. Existing subscribers keep their original price and included products.":"Draft saved. Open the offer to preview it and publish when ready.");
    }catch(e){setError(e instanceof Error?e.message:"Couldn't save this offer.");}
    finally{lock.current=false;setBusy(false);}
  }
  return <Screen>
    <H1>More value, together.</H1>
    <Body muted>Package your digital products into a bundle, or offer ongoing access with a monthly or yearly subscription.</Body>
    <Notice text={error} tone="error" />
    {loading?<Body>Loading your store…</Body>:<>
      {eligible.length<2 ? <Notice text="Bundles need at least two digital products with downloads attached. A subscription can start with one." />:null}
      <Segmented value={billing} onChange={setBilling} options={[{value:"once",label:"Bundle"},{value:"month",label:"Monthly"},{value:"year",label:"Yearly"}]} />
      <Field label="Offer name" value={title} onChangeText={setTitle} maxLength={120} placeholder="The Home Chef Collection" />
      <Field label="What buyers receive" value={description} onChangeText={setDescription} multiline maxLength={3000} placeholder="Explain the included resources and who they help." />
      <H2>Included products</H2>
      {eligible.map((p)=><Pressable key={p.id} disabled={busy||!p.has_delivery} accessibilityRole="checkbox" accessibilityState={{checked:selected.includes(p.id),disabled:!p.has_delivery}} onPress={()=>setSelected(selected.includes(p.id)?selected.filter((x)=>x!==p.id):[...selected,p.id])}
        style={{padding:space.md,borderRadius:radius.md,borderWidth:1,borderColor:selected.includes(p.id)?c.accent:c.line,backgroundColor:c.surface,opacity:p.has_delivery?1:.55}}>
        <Text style={[type.heading,{color:c.ink}]}>{selected.includes(p.id)?"✓ ":"○ "}{p.title}</Text>
        <Body muted>{money(p.price)} · {p.status}{!p.has_delivery?" · Attach a download first":""}</Body>
      </Pressable>)}
      <Field label={billing==="once"?"Bundle price ($)":`Price per ${billing==="month"?"month":"year"} ($)`} value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="19.00" />
      {chosen.length ? <Body muted>{chosen.length} products · {money(regular)} purchased separately.{billing==="once"&&amount>0&&amount<regular?` Bundle saves ${money(regular-amount)}.`:""}</Body>:null}
      {billing!=="once"?<Notice text="Buyers are charged automatically until canceled. Their order page provides downloads and a billing portal. Access ends when the paid period ends or payment fails. Files already downloaded cannot be recalled. Price and included-product edits apply only to new subscribers." />:null}
      <Button label={id?"Save offer changes":"Create offer draft"} disabled={!valid||busy} loading={busy} onPress={save} />
      <Notice text={notice} tone="ok" />
      {id?<Button label="Preview & publish this offer" variant="secondary" onPress={()=>router.push({pathname:"/product/[id]",params:{id}})} />:null}
      <Button label="Start a new offer" variant="ghost" disabled={busy} onPress={()=>{setId(undefined);setTitle("");setDescription("");setPrice("");setSelected([]);setNotice(null);}} />
      {products.some((p)=>p.bundle_product_ids?.length)?<H2>Your offers</H2>:null}
      {products.filter((p)=>p.bundle_product_ids?.length).map((p)=><Button key={p.id} label={`${p.title} · ${money(p.price)}${p.billing_interval?`/${p.billing_interval}`:""} · ${p.status}`} variant="secondary" disabled={busy} onPress={()=>edit(p)} />)}
      {subscribers.length?<H2>Subscribers</H2>:null}
      {subscribers.map((s)=><View key={s.id} style={{padding:space.md,borderRadius:radius.md,backgroundColor:c.surface,gap:space.xs}}>
        <Body>{s.email} · {s.title}</Body><Body muted>{s.status}{s.cancel_at_period_end?" · Cancels at period end":""} · {money(s.revenue_cents/100)} collected</Body>
      </View>)}
      <Button label="Back to store design" variant="secondary" onPress={()=>router.navigate("/storefront-setup")} />
    </>}
  </Screen>;
}
