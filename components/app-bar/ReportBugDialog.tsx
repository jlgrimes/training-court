'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { navigationMenuTriggerStyle } from "../ui/navigation-menu"
import { Label } from "../ui/label"
import { useCallback, useState } from "react"
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import { useToast } from "../ui/use-toast";
import { CardDescription } from "../ui/card";
import { Bug } from "lucide-react";
import { SidebarMenuButton } from "../ui/sidebar";
import { T, useGT } from "gt-react";

const Bugs = {
  BattleLogs: {
    MissingDeck: 'missing-deck',
    WrongDeck: 'wrong-deck',
    ImportingDeck: 'importing-deck',
    FeatureRequest: 'feature-request',
    Other: 'other'
  },
  Tournaments: {
    VisualGlitch: 'visual-glitch',
    FeatureRequest: 'feature-request',
    Other: 'other'
  }
}

interface ReportBugDialogProps {
  user: User | null;
}

export const ReportBugDialog = (props: ReportBugDialogProps) => {
  const { toast } = useToast();
  const gt = useGT();
  
  const [featureName, setFeatureName] = useState<string | undefined>();
  const [bugType, setBugType] = useState<string | undefined>();
  const [description, setDescription] = useState<string | undefined>();

  const submitFeedback = useCallback(async () => {
    const supabase = createClient();
    const { error } = await supabase.from('feedback').insert({
      user_id: props.user?.id,
      feature_name: featureName,
      bug_type: bugType ?? null,
      description
    });

    if (error) {
      toast({
        variant: "destructive",
        title: gt("Uh oh! Something went wrong.", { $id: "feedback.error.title" }),
        description: error.message,
      })
    } else {
      toast({
        title: gt("Feedback submitted! Thanks for making Training Court better :)", { $id: "feedback.success.title" }),
      });
      setFeatureName(undefined);
      setBugType(undefined);
      setDescription(undefined);
    }
  }, [toast, createClient, props.user?.id, featureName, bugType, description]);

  return (
    <Dialog>
      <DialogTrigger className="w-full">
        <SidebarMenuButton asChild>
          <span><Bug />
          <span><T id="feedback.navLabel">Feedback</T></span></span>
        </SidebarMenuButton>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle><T id="feedback.dialog.title">Submit feedback</T></DialogTitle>
        </DialogHeader>

        <div>
          <Label className="mb-2"><T id="feedback.featureName">Feature name</T></Label>
          <Select onValueChange={(value) => setFeatureName(value)}>
            <SelectTrigger>
              <SelectValue placeholder={gt("Ex. Battle logs", { $id: "feedback.featurePlaceholder" })} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="battle-logs"><T id="feedback.feature.battleLogs">Battle logs</T></SelectItem>
              <SelectItem value="tournaments"><T id="feedback.feature.tournaments">Tournaments</T></SelectItem>
              <SelectItem value="other"><T id="feedback.feature.other">Other</T></SelectItem>
            </SelectContent>
          </Select>
        </div>

        {
          featureName && featureName !== 'other' && (
            <div>
          <Label className="mb-2"><T id="feedback.bugType">Type of bug</T></Label>
          <Select onValueChange={(value) => setBugType(value)}>
            <SelectTrigger>
              <SelectValue placeholder={gt("Ex. wrong deck", { $id: "feedback.bugPlaceholder" })} />
            </SelectTrigger>
            <SelectContent>
              {featureName === 'battle-logs' && (
                <>
                  <SelectItem value={Bugs.BattleLogs.MissingDeck}><T id="feedback.bug.missingDeck">Missing deck</T></SelectItem>
                  <SelectItem value={Bugs.BattleLogs.WrongDeck}><T id="feedback.bug.wrongDeck">Wrong deck identified</T></SelectItem>
                  <SelectItem value={Bugs.BattleLogs.ImportingDeck}><T id="feedback.bug.importingDeck">Problem with importing deck</T></SelectItem>
                  <SelectItem value={Bugs.BattleLogs.FeatureRequest}><T id="feedback.bug.featureRequest">Feature request</T></SelectItem>
                  <SelectItem value={Bugs.BattleLogs.Other}><T id="feedback.bug.other">Other</T></SelectItem>
                </>
              )}
              {featureName === 'tournaments' && (
                <>
                  <SelectItem value={Bugs.Tournaments.VisualGlitch}><T id="feedback.bug.visualGlitch">Visual glitch</T></SelectItem>
                  <SelectItem value={Bugs.Tournaments.FeatureRequest}><T id="feedback.bug.featureRequest">Feature request</T></SelectItem>
                  <SelectItem value={Bugs.Tournaments.Other}><T id="feedback.bug.other">Other</T></SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>
          )
        }
        {((bugType === Bugs.BattleLogs.WrongDeck) || (bugType === Bugs.BattleLogs.MissingDeck)) && (
          <T id="feedback.deckFixHelp">
            <CardDescription>To fix this issue yourself, click "Edit logs" on the top of battle logs, click the edit button, and change/add the deck that isn't being recognized correctly. Of course, we would still love feedback!</CardDescription>
          </T>
        )}
        {
          (featureName === 'other' || bugType) && (
            <div>
              <Label className="mb-2"><T id="feedback.tellUsMore">Tell us more</T></Label>
              <Textarea onChange={(e) => setDescription(e.target.value)} />
            </div>
          )
        }
        <DialogFooter>
          <Button disabled={!description} onClick={submitFeedback}><T id="feedback.submit">Submit</T></Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
