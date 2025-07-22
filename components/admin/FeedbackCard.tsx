'use client';

import { Database } from "@/database.types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { useCallback, useEffect, useState } from "react";
import { Badge } from "../ui/badge";
import { formatDistanceToNowStrict } from "date-fns";
import { createClient } from "@/utils/supabase/client";
import { Button } from "../ui/button";
import { useToast } from "../ui/use-toast";

interface FeedbackCardProps {
  feedback: Database['public']['Tables']['feedback']['Row'];
}

export const FeedbackCard = (props: FeedbackCardProps) => {
  const { toast } = useToast();
  const [isFixed, setIsFixed] = useState(props.feedback.is_fixed);

  useEffect(() => {
    setIsFixed(props.feedback.is_fixed);
  }, [props.feedback.is_fixed]);

  const onResolveClick = useCallback(async () => {
    const supabase = createClient();
    const { error } = await supabase.from('feedback').update({ is_fixed: true }).eq('id', props.feedback.id);
    if (error) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: error.message,
      })
    } else {
      setIsFixed(true);
      toast({
        title: "resolved :)",
      });
    }
  }, [setIsFixed, props.feedback.id]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{`${props.feedback.feature_name} > ${props.feedback.bug_type}`} {isFixed && <Badge variant='secondary' className="bg-green-200 ml-1">Resolved</Badge>}</CardTitle>
        <CardDescription>{formatDistanceToNowStrict(props.feedback.created_at || new Date(), { addSuffix: true })}</CardDescription>
      </CardHeader>
      <CardContent>
        <>
          <p>{props.feedback.description}</p>
          {props.feedback.dev_notes && <CardDescription className="mt-2">Dev notes: {props.feedback.dev_notes}</CardDescription>}
          {!isFixed && <Button variant='outline' size='sm' className="mt-2" onClick={onResolveClick}>Resolve</Button>}
        </>
      </CardContent>
    </Card>
  )
}