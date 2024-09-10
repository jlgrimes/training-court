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
        title: "Uh oh! Something went wrong.",
        description: error.message,
      })
    } else {
      toast({
        title: "Feedback submitted! Thanks for making Training Court better :)",
      });
    }
  }, [toast, createClient, props.user?.id, featureName, bugType, description]);

  return (
    <Dialog>
      <DialogTrigger className={navigationMenuTriggerStyle()}>
        Feedback
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit feedback</DialogTitle>
        </DialogHeader>

        <div>
          <Label className="mb-2">Feature name</Label>
          <Select onValueChange={(value) => setFeatureName(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Ex. Battle logs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="battle-logs">Battle logs</SelectItem>
              <SelectItem value="tournaments">Tournaments</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {
          featureName && featureName !== 'other' && (
            <div>
          <Label className="mb-2">Type of bug</Label>
          <Select onValueChange={(value) => setBugType(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Ex. wrong deck" />
            </SelectTrigger>
            <SelectContent>
              {featureName === 'battle-logs' && (
                <>
                  <SelectItem value={Bugs.BattleLogs.MissingDeck}>Missing deck</SelectItem>
                  <SelectItem value={Bugs.BattleLogs.WrongDeck}>Wrong deck identified</SelectItem>
                  <SelectItem value={Bugs.BattleLogs.ImportingDeck}>Problem with importing deck</SelectItem>
                  <SelectItem value={Bugs.BattleLogs.FeatureRequest}>Feature request</SelectItem>
                  <SelectItem value={Bugs.BattleLogs.Other}>Other</SelectItem>
                </>
              )}
              {featureName === 'tournaments' && (
                <>
                  <SelectItem value={Bugs.Tournaments.VisualGlitch}>Visual glitch</SelectItem>
                  <SelectItem value={Bugs.Tournaments.FeatureRequest}>Feature request</SelectItem>
                  <SelectItem value={Bugs.Tournaments.Other}>Other</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>
          )
        }
        {
          (featureName === 'other' || bugType) && (
            <div>
              <Label className="mb-2">Tell us more</Label>
              <Textarea onChange={(e) => setDescription(e.target.value)} />
            </div>
          )
        }
        <DialogFooter>
          <Button disabled={!description} onClick={submitFeedback}>Submit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}