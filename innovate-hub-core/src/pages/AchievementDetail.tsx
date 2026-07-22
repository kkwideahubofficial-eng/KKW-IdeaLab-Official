import { Link, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ArrowLeft,
  Award,
  BadgeCheck,
  Banknote,
  BookOpen,
  Calendar,
  ExternalLink,
  Globe,
  Layers3,
  Shield,
  Sparkles,
  Star,
  Target,
  Trophy,
  Users,
} from "lucide-react";

interface AchievementDetailData {
  _id: string;
  title: string;
  description: string;
  date: string;
  achievedBy: string;
  imageUrl?: string;
  achievementType?: string;
  contributionDomain?: string;
  competitionLevel?: string;
  prizeAmount?: number;
  eventYear?: number;
  teamSize?: number;
  ideaHubContributions?: Record<string, boolean>;
}

const CONTRIBUTION_LABELS: Array<{ key: string; label: string }> = [
  { key: "workspaceProvided", label: "Workspace Provided" },
  { key: "meetingRoomAccess", label: "Meeting Room Access" },
  { key: "dPrintingSupport", label: "3D Printing Support" },
  { key: "electronicsComponents", label: "Electronics Components" },
  { key: "prototypeDevelopment", label: "Prototype Development" },
  { key: "testingFacility", label: "Testing Facility" },
  { key: "mentorshipSupport", label: "Mentorship Support" },
  { key: "presentationGuidance", label: "Presentation Guidance" },
  { key: "competitionRegistration", label: "Competition Registration" },
  { key: "industryMentoring", label: "Industry Mentoring" },
];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatCurrency(value?: number) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function getContributionBadges(contributions?: Record<string, boolean>) {
  if (!contributions) return [];
  return CONTRIBUTION_LABELS.filter(({ key }) => contributions[key]).map(({ label }) => label);
}

const AchievementDetail = () => {
  const { id } = useParams();
  const [achievement, setAchievement] = useState<AchievementDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAchievement = async () => {
      try {
        const res = await api.get(`/achievements/${id}`);
        setAchievement(res.data);
      } catch {
        setAchievement(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAchievement();
  }, [id]);

  const contributionBadges = useMemo(() => getContributionBadges(achievement?.ideaHubContributions), [achievement]);

  const detailHighlights = useMemo(
    () => [
      { label: "Achievement Type", value: achievement?.achievementType || "General Achievement", icon: Award },
      { label: "Competition Level", value: achievement?.competitionLevel || "Not specified", icon: Globe },
      { label: "Contribution Domain", value: achievement?.contributionDomain || "General", icon: BookOpen },
      {
        label: "Team Size",
        value: achievement?.teamSize ? `${achievement.teamSize} member${achievement.teamSize === 1 ? "" : "s"}` : "Not specified",
        icon: Users,
      },
      { label: "Prize Amount", value: achievement?.prizeAmount ? formatCurrency(achievement.prizeAmount) : "No prize recorded", icon: Banknote },
      { label: "Academic Year", value: achievement?.eventYear ? String(achievement.eventYear) : "Derived from date", icon: Calendar },
    ],
    [achievement],
  );

  return (
    <div className="container mx-auto max-w-6xl space-y-6 px-4 py-8">
      <Link to="/achievements">
        <Button variant="ghost" className="mb-2 gap-2 pl-0 hover:bg-transparent hover:text-primary">
          <ArrowLeft className="h-4 w-4" />
          Back to Achievements
        </Button>
      </Link>

      {loading ? (
        <div className="py-20 text-center text-muted-foreground">Loading achievement details...</div>
      ) : !achievement ? (
        <div className="py-20 text-center text-muted-foreground">Achievement not found.</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="space-y-6">
            <Card className="overflow-hidden border-border/60 shadow-sm">
              <div className="relative aspect-[16/9] bg-muted/30">
                {achievement.imageUrl ? (
                  <img src={achievement.imageUrl} alt={achievement.title} className="h-full w-full object-cover object-top" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 via-muted/20 to-background">
                    <div className="flex flex-col items-center gap-3 text-center text-muted-foreground">
                      <Trophy className="h-16 w-16 text-primary/40" />
                      <p className="text-sm font-medium uppercase tracking-[0.2em]">Innovation Showcase</p>
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white sm:p-8">
                  <div className="mb-4 flex flex-wrap gap-2">
                    {achievement.achievementType ? <Badge className="border-white/20 bg-white/15 text-white backdrop-blur">{achievement.achievementType}</Badge> : null}
                    {achievement.competitionLevel ? <Badge className="border-white/20 bg-white/15 text-white backdrop-blur">{achievement.competitionLevel}</Badge> : null}
                    {achievement.contributionDomain ? <Badge className="border-white/20 bg-white/15 text-white backdrop-blur">{achievement.contributionDomain}</Badge> : null}
                  </div>
                  <h1 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">{achievement.title}</h1>
                  <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-white/85">
                    <span className="inline-flex items-center gap-2"><Calendar className="h-4 w-4" /> {formatDate(achievement.date)}</span>
                    <span className="inline-flex items-center gap-2"><Users className="h-4 w-4" /> {achievement.achievedBy}</span>
                    {achievement.prizeAmount ? <span className="inline-flex items-center gap-2"><Star className="h-4 w-4" /> {formatCurrency(achievement.prizeAmount)}</span> : null}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="border-border/60 shadow-sm">
              <CardHeader className="space-y-2">
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Sparkles className="h-5 w-5 text-primary" /> Recognition Summary
                </CardTitle>
                <CardDescription>A certificate-style overview of the achievement and the support behind it.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-3xl border border-border/60 bg-gradient-to-br from-muted/25 via-background to-primary/5 p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">AICTE IDEA Lab Recognition</p>
                      <h2 className="mt-2 text-2xl font-bold text-foreground">{achievement.title}</h2>
                      <p className="mt-2 max-w-2xl whitespace-pre-line text-sm leading-6 text-muted-foreground">
                        {achievement.description}
                      </p>
                    </div>
                    <div className="hidden rounded-2xl border border-primary/15 bg-primary/5 p-3 text-primary sm:block">
                      <BadgeCheck className="h-8 w-8" />
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {detailHighlights.map((item) => (
                      <div key={item.label} className="rounded-2xl border border-border/60 bg-background/80 p-4">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          <item.icon className="h-4 w-4 text-primary" />
                          {item.label}
                        </div>
                        <div className="mt-2 text-sm font-semibold text-foreground">{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-6">
            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Target className="h-5 w-5 text-primary" /> Quick Facts
                </CardTitle>
                <CardDescription>Key metadata for this achievement.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {detailHighlights.map((item) => (
                  <div key={item.label} className="flex items-start justify-between gap-4 rounded-2xl border border-border/60 bg-muted/20 px-4 py-3">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className="max-w-[55%] text-right text-sm font-semibold text-foreground">{item.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Shield className="h-5 w-5 text-primary" /> AICTE IDEA Lab Support
                </CardTitle>
                <CardDescription>Workshops, mentoring, and infrastructure used for this result.</CardDescription>
              </CardHeader>
              <CardContent>
                {contributionBadges.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {contributionBadges.map((label) => (
                      <Badge key={label} variant="secondary" className="gap-1.5 rounded-full px-3 py-1.5">
                        <BadgeCheck className="h-3.5 w-3.5" />
                        {label}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No AICTE IDEA Lab contribution flags were stored for this entry.</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Layers3 className="h-5 w-5 text-primary" /> Spotlight
                </CardTitle>
                <CardDescription>Highlights pulled directly from the achievement record.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    <ExternalLink className="h-3.5 w-3.5" /> Record Owner
                  </div>
                  <div className="mt-2 text-sm font-semibold text-foreground">{achievement.achievedBy}</div>
                </div>
                <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    <Award className="h-3.5 w-3.5" /> Prize Status
                  </div>
                  <div className="mt-2 text-sm font-semibold text-foreground">{achievement.prizeAmount ? formatCurrency(achievement.prizeAmount) : "No prize recorded"}</div>
                </div>
                <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    <Globe className="h-3.5 w-3.5" /> Scope
                  </div>
                  <div className="mt-2 text-sm font-semibold text-foreground">{achievement.competitionLevel || "General / Internal"}</div>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      )}
    </div>
  );
};

export default AchievementDetail;
