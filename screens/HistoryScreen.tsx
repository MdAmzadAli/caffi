import React from "react";
import { View, StyleSheet, Text, Pressable, ScrollView, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { HistoryStackParamList } from "@/navigation/HistoryStackNavigator";

type NavigationProp = NativeStackNavigationProp<HistoryStackParamList>;

interface Article {
  id: string;
  title: string;
  summary: string;
  image: string;
  content: string;
  references: string[];
}

interface Section {
  title: string;
  articles: Article[];
}

const SECTIONS: Section[] = [
  {
    title: "Caffeine",
    articles: [
      {
        id: "caf-1",
        title: "Understanding How Caffeine Works in Your Body",
        summary: "A look at how this popular stimulant affects your brain and nervous system.",
        image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=100&h=100&fit=crop",
        content: "Caffeine is one of the most widely consumed psychoactive substances in the world, found naturally in coffee beans, tea leaves, and cacao pods. When you consume caffeine, it travels through your bloodstream to your brain within about 15 to 45 minutes. Once there, it blocks adenosine receptors, which are responsible for making you feel tired and sleepy. By blocking these receptors, caffeine prevents the natural buildup of drowsiness that occurs throughout the day.\n\nThis blocking action also triggers the release of other neurotransmitters like dopamine and norepinephrine, which contribute to improved mood, alertness, and concentration. Your heart rate may increase slightly, and your blood pressure can rise temporarily. The liver metabolizes caffeine, with a half-life of about 5 to 6 hours in most adults, meaning half of the caffeine you consume is still active in your system hours later.\n\nCaffeine also stimulates the release of adrenaline, preparing your body for physical exertion. This is why many athletes use caffeine as a performance enhancer before workouts or competitions. Additionally, caffeine can increase thermogenesis, the process by which your body generates heat and burns calories. Research suggests that regular moderate consumption may offer protective benefits against certain neurodegenerative conditions.\n\nHowever, individual responses to caffeine vary significantly based on genetics, tolerance levels, and overall health. Some people metabolize caffeine quickly and feel minimal effects, while others are highly sensitive and may experience jitters, anxiety, or sleep disturbances from even small amounts. Understanding your personal response to caffeine can help you optimize your intake for maximum benefit with minimal side effects.",
        references: [
          "National Institutes of Health - Overview of Caffeine Effects on Human Health (2024)",
          "European Food Safety Authority - Scientific Opinion on Caffeine Safety",
          "Mayo Clinic - Caffeine: How Much is Too Much",
        ],
      },
      {
        id: "caf-2",
        title: "Daily Caffeine Limits: What Science Recommends",
        summary: "Guidelines for safe consumption across different age groups and conditions.",
        image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=100&h=100&fit=crop",
        content: "Health authorities around the world have established guidelines for safe caffeine consumption based on extensive research. For healthy adults, the general consensus is that up to 400 milligrams per day is considered safe, which translates to approximately four standard cups of brewed coffee. This amount has been shown to provide cognitive benefits without significantly increasing health risks for most people.\n\nPregnant and breastfeeding women are advised to limit their intake to no more than 200 milligrams daily. This reduced limit exists because caffeine crosses the placenta and can affect fetal development, potentially leading to lower birth weight or other complications. The developing fetus lacks the enzymes needed to metabolize caffeine efficiently, making it particularly vulnerable to its effects.\n\nTeenagers aged 12 to 18 should consume no more than 100 milligrams of caffeine per day, roughly equivalent to one cup of coffee. Children under 12 are advised to avoid caffeine entirely or limit intake to very small amounts. Their developing nervous systems are more sensitive to stimulants, and caffeine can interfere with sleep patterns crucial for growth and development.\n\nPeople with certain health conditions need to be especially cautious. Those with heart arrhythmias, anxiety disorders, or sleep problems may need to significantly reduce or eliminate caffeine. If you experience symptoms like rapid heartbeat, persistent anxiety, or chronic insomnia, consulting with a healthcare provider about your caffeine intake is recommended. Individual tolerance varies widely, so paying attention to your body's signals is essential for determining your optimal intake level.",
        references: [
          "FDA Guidelines on Caffeine Consumption (2024)",
          "American Academy of Pediatrics - Caffeine and Children",
          "World Health Organization - Caffeine Intake Recommendations",
        ],
      },
      {
        id: "caf-3",
        title: "Caffeine Withdrawal: Symptoms and Management",
        summary: "What happens when you suddenly stop consuming caffeine and how to cope.",
        image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=100&h=100&fit=crop",
        content: "Caffeine withdrawal is a recognized medical condition that occurs when regular caffeine consumers suddenly reduce or stop their intake. Symptoms typically begin 12 to 24 hours after the last caffeine dose and can last anywhere from two to nine days. The severity of withdrawal depends on the amount typically consumed and individual sensitivity levels.\n\nThe most common withdrawal symptom is headache, which affects more than half of people who quit caffeine abruptly. These headaches occur because caffeine causes blood vessels in the brain to constrict, and when caffeine is removed, the vessels dilate, causing pain. Fatigue and drowsiness are also extremely common, as the body suddenly loses its artificial energy boost and must readjust to functioning without the stimulant.\n\nMood changes including irritability, difficulty concentrating, and even mild depression can occur during withdrawal. Some people experience flu-like symptoms such as nausea, muscle aches, and general malaise. These symptoms happen because the brain has adapted to the presence of caffeine and needs time to recalibrate its normal functioning without it.\n\nTo minimize withdrawal symptoms, experts recommend gradually reducing caffeine intake over one to two weeks rather than stopping abruptly. Cutting your daily intake by about 10 to 25 percent each week allows your body to adjust slowly. Staying well-hydrated, getting adequate sleep, and engaging in light exercise can also help ease the transition. Some people find that switching to lower-caffeine beverages like green tea can provide a gentler step-down approach.",
        references: [
          "Journal of Caffeine Research - Caffeine Withdrawal Syndrome",
          "Cleveland Clinic - Managing Caffeine Withdrawal",
          "National Library of Medicine - Caffeine Dependence Studies",
        ],
      },
    ],
  },
  {
    title: "Coffee",
    articles: [
      {
        id: "cof-1",
        title: "The Journey of Coffee: From Ethiopian Forests to Your Cup",
        summary: "Exploring the rich history and global spread of coffee cultivation.",
        image: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=100&h=100&fit=crop",
        content: "Coffee has a fascinating origin story that begins in the ancient forests of Ethiopia. Legend tells of a goat herder named Kaldi who noticed his goats becoming unusually energetic after eating berries from a certain tree. This discovery, believed to have occurred around the 9th century, marked the beginning of humanity's relationship with coffee. The berries were initially consumed as food, mixed with animal fat to create energy-boosting snacks.\n\nBy the 15th century, coffee cultivation had spread to Yemen, where Sufi monks began brewing the beans into a beverage to help them stay awake during lengthy nighttime prayers. The port city of Mocha became a major trading hub for coffee, giving its name to the chocolate-coffee flavor combination we know today. Coffeehouses, known as qahveh khaneh, emerged throughout the Arabian Peninsula and became centers of social activity, music, and intellectual discussion.\n\nCoffee reached Europe in the 17th century, arriving first in Venice through trade routes. Initially met with suspicion and even called the bitter invention of Satan by some clergy, coffee eventually gained papal approval and quickly became popular across the continent. London's first coffeehouse opened in 1652, and these establishments became known as penny universities because for the price of a cup, one could engage in stimulating conversation and learn about current events.\n\nColonial powers spread coffee cultivation to their territories around the world. The Dutch brought coffee to Java, the French to the Caribbean, and eventually cultivation reached Brazil and Central America. Today, over 70 countries produce coffee, with Brazil remaining the world's largest producer. The journey from those Ethiopian forests has made coffee the second most traded commodity globally after oil, consumed by billions of people every day.",
        references: [
          "National Coffee Association - History of Coffee",
          "Britannica Encyclopedia - Coffee Origins and History",
          "Smithsonian Magazine - The Complex History of Coffee",
        ],
      },
      {
        id: "cof-2",
        title: "Arabica vs Robusta: Comparing Coffee Bean Varieties",
        summary: "Understanding the key differences between the world's two main coffee species.",
        image: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=100&h=100&fit=crop",
        content: "The coffee world is dominated by two main species: Arabica and Robusta, which together account for virtually all commercial coffee production. Arabica, scientifically known as Coffea arabica, represents about 60 to 70 percent of global production and is prized for its complex, nuanced flavors. It originated in the highlands of Ethiopia and thrives at higher altitudes between 2,000 and 6,000 feet, requiring specific growing conditions with steady rainfall and moderate temperatures.\n\nRobusta, or Coffea canephora, makes up the remaining 30 to 40 percent of production. As its name suggests, this species is more robust and hardy, capable of growing at lower altitudes and withstanding harsher conditions. Robusta plants are more resistant to diseases and pests, partly due to their higher caffeine content, which acts as a natural insecticide. Vietnam is the world's largest producer of Robusta beans.\n\nThe flavor profiles of these two species differ significantly. Arabica beans tend to have a sweeter, softer taste with notes of fruit, berries, and even floral undertones. They contain more natural sugars and higher acidity, contributing to their complexity. Robusta beans, in contrast, have a stronger, harsher, and more bitter taste, often described as earthy or woody. They contain nearly twice the caffeine of Arabica beans.\n\nBeyond these two main species, coffee enthusiasts are increasingly interested in lesser-known varieties like Liberica and Excelsa. Liberica, grown primarily in the Philippines and Malaysia, has a distinctive smoky, woody flavor with floral notes. The choice between coffee types ultimately depends on personal preference, brewing method, and whether you prioritize flavor complexity or caffeine content. Many espresso blends combine both Arabica and Robusta to achieve a balance of flavor and crema.",
        references: [
          "Specialty Coffee Association - Coffee Varieties Guide",
          "Coffee Research Institute - Arabica and Robusta Comparison",
          "International Coffee Organization - Coffee Species Overview",
        ],
      },
      {
        id: "cof-3",
        title: "How Roasting Transforms the Coffee Bean",
        summary: "The science behind light, medium, and dark roasts and their flavor profiles.",
        image: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=100&h=100&fit=crop",
        content: "The roasting process is where green coffee beans transform into the aromatic brown beans we recognize. This transformation involves complex chemical reactions that develop the flavors, aromas, and colors we associate with coffee. Raw green beans are dense and have a grassy, almost hay-like smell, nothing like the rich aroma of roasted coffee. The roasting process unlocks hundreds of aromatic compounds that create coffee's characteristic flavor.\n\nDuring roasting, beans undergo the Maillard reaction, the same chemical process that browns bread crust and seared meat. As temperatures rise above 300 degrees Fahrenheit, sugars and amino acids combine to create new flavor compounds. Caramelization of sugars adds sweetness and complexity. At around 400 degrees, beans experience first crack, an audible popping sound as steam escapes, marking the transition to a light roast.\n\nLight roasts preserve more of the bean's original characteristics, including higher acidity and fruity or floral notes. They retain more caffeine than darker roasts and showcase the unique flavors of different growing regions. Medium roasts balance origin characteristics with roast flavors, offering a more rounded profile with reduced acidity. This level is often preferred for everyday drinking and reveals notes of chocolate, nuts, and caramel.\n\nDark roasts are taken past the second crack, where oils begin to appear on the bean's surface. These roasts emphasize bold, smoky, and sometimes bitter flavors while muting the bean's origin characteristics. Contrary to popular belief, dark roasts actually contain slightly less caffeine than lighter roasts because the roasting process breaks down caffeine molecules. The choice of roast level is largely a matter of personal preference, though certain brewing methods pair better with specific roast levels.",
        references: [
          "Coffee Science Foundation - The Chemistry of Roasting",
          "Roasters Guild - Understanding Roast Levels",
          "Food Chemistry Journal - Maillard Reaction in Coffee",
        ],
      },
    ],
  },
  {
    title: "Energy Drinks",
    articles: [
      {
        id: "eng-1",
        title: "What Goes Into Energy Drinks: A Complete Breakdown",
        summary: "Examining the key ingredients found in popular energy beverages.",
        image: "https://images.unsplash.com/photo-1527960471264-932f39eb5846?w=100&h=100&fit=crop",
        content: "Energy drinks have become a multi-billion dollar industry, particularly popular among young adults and athletes. Understanding what goes into these beverages is essential for making informed consumption choices. The primary active ingredient in most energy drinks is caffeine, typically ranging from 80 to 320 milligrams per can, with some products containing even more. For context, a standard cup of coffee contains about 95 milligrams.\n\nTaurine is another common ingredient, an amino acid naturally found in meat, fish, and dairy. Energy drinks often contain 750 to 1,000 milligrams of taurine per serving. While taurine plays important roles in the body including supporting neurological development and regulating mineral levels in cells, research on its effects when combined with high doses of caffeine is still evolving.\n\nMany energy drinks contain significant amounts of sugar, sometimes as much as 54 grams per can, which equals about 13 teaspoons. This sugar provides quick energy but can lead to blood sugar spikes followed by crashes. Some brands offer sugar-free versions that use artificial sweeteners instead. B vitamins are commonly added, though most people already get adequate amounts through their regular diet.\n\nGuarana and yerba mate are often included as additional sources of caffeine, though their caffeine content may not be separately listed on labels. This means the total caffeine in a drink could be higher than what appears on the nutrition facts. Other additives include ginseng, glucuronolactone, and L-carnitine. While these ingredients are marketed as enhancing the energizing effects, scientific evidence supporting their benefits when added to energy drinks is limited.",
        references: [
          "Harvard Health Publishing - Energy Drink Ingredients",
          "NIH National Center for Complementary and Integrative Health",
          "European Food Safety Authority - Energy Drink Assessment",
        ],
      },
      {
        id: "eng-2",
        title: "Energy Drinks and Heart Health: Current Research",
        summary: "What studies reveal about cardiovascular effects of energy drink consumption.",
        image: "https://images.unsplash.com/photo-1622543925917-763c34d1a86e?w=100&h=100&fit=crop",
        content: "Research into the cardiovascular effects of energy drinks has intensified in recent years, with findings that warrant attention from consumers. Studies have documented that consuming energy drinks can cause immediate increases in heart rate and blood pressure, even in healthy young adults. Blood pressure can rise by 6 to 7 points within 30 minutes of consumption, effects that may persist for several hours.\n\nMore concerning are documented cases of serious cardiac events associated with energy drink consumption. Medical literature includes reports of heart arrhythmias, including atrial fibrillation and ventricular tachycardia, occurring after energy drink intake. Some cases have resulted in cardiac arrest, particularly when drinks were consumed in large quantities or combined with alcohol or intense physical activity.\n\nThe combination of ingredients in energy drinks appears to have effects beyond what caffeine alone would produce. Research suggests that the interaction between caffeine, taurine, and other stimulants may create a synergistic effect on the cardiovascular system. Studies have shown changes in the heart's electrical activity, specifically QT interval prolongation, which can increase the risk of dangerous heart rhythms.\n\nHealth organizations recommend that people with existing heart conditions, high blood pressure, or a family history of cardiac problems avoid energy drinks entirely. For healthy adults who choose to consume them, moderation is essential. Experts suggest limiting intake to no more than one can per day and avoiding combining energy drinks with alcohol or consuming them before or during intense exercise. Children and adolescents are advised not to consume energy drinks due to their developing cardiovascular systems.",
        references: [
          "American Heart Association - Energy Drinks and Heart Health",
          "Journal of the American College of Cardiology - Cardiovascular Effects Study",
          "Mayo Clinic - Energy Drinks: Health Risks",
        ],
      },
      {
        id: "eng-3",
        title: "Youth and Energy Drinks: Age-Appropriate Guidelines",
        summary: "Why health experts recommend children and teens avoid energy drinks.",
        image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100&h=100&fit=crop",
        content: "The American Academy of Pediatrics has taken a clear stance: energy drinks have no place in the diets of children and adolescents. This recommendation stems from growing evidence that young people are particularly vulnerable to the effects of these highly caffeinated beverages. Unlike coffee or tea, which teens might consume in moderate amounts, energy drinks are often marketed aggressively to young consumers and packaged in ways that encourage overconsumption.\n\nChildren and teenagers metabolize caffeine more slowly than adults, meaning its effects last longer in their systems. Their developing nervous systems are also more sensitive to stimulants. Research has linked energy drink consumption in adolescents to increased rates of anxiety, sleep disturbances, and behavioral problems. Sleep disruption is particularly concerning during adolescence, a period when adequate rest is crucial for physical and cognitive development.\n\nEmergency room visits related to energy drink consumption among young people have increased significantly over the past decade. Many of these visits involve heart palpitations, seizures, or severe anxiety. The high sugar content in many energy drinks also contributes to obesity risk and dental problems, issues already prevalent among youth.\n\nSeveral countries have implemented age restrictions on energy drink sales. Lithuania became the first European Union country to ban sales to minors under 18, followed by Latvia. Some regions require warning labels specifically mentioning risks for children. For parents concerned about their teenager's energy drink consumption, having open conversations about the risks and suggesting healthier alternatives like water, milk, or small amounts of regular coffee or tea can be helpful approaches.",
        references: [
          "American Academy of Pediatrics - Position Statement on Energy Drinks",
          "CDC - Energy Drinks and Youth Health",
          "Pediatrics Journal - Caffeine and Adolescent Health",
        ],
      },
    ],
  },
  {
    title: "Sleep & Alertness",
    articles: [
      {
        id: "slp-1",
        title: "How Caffeine Disrupts Your Sleep Patterns",
        summary: "Understanding the science behind caffeine's impact on sleep quality and duration.",
        image: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=100&h=100&fit=crop",
        content: "Caffeine's effects on sleep extend far beyond simply making it harder to fall asleep. Research using sleep monitoring technology has revealed that caffeine consumption affects multiple aspects of sleep architecture, even when consumed many hours before bedtime. A comprehensive analysis of controlled studies found that caffeine reduces total sleep time by an average of 35 minutes and decreases sleep efficiency by nearly 5 percent.\n\nOne of caffeine's most significant impacts is on slow-wave sleep, the deepest and most restorative phase of the sleep cycle. This stage is crucial for physical recovery, immune function, and memory consolidation. Studies show that caffeine reduces the amount of time spent in slow-wave sleep, meaning even if you sleep for your usual duration, the quality of that sleep is diminished. You may wake feeling less refreshed and restored.\n\nThe timing of caffeine consumption matters enormously. Caffeine has a half-life of approximately 5 to 6 hours, meaning half of the caffeine from your afternoon coffee is still circulating in your bloodstream at bedtime. Research suggests stopping caffeine intake by mid-afternoon, ideally 6 to 8 hours before your planned sleep time. However, individual sensitivity varies significantly based on genetics, with some people being rapid metabolizers and others slow metabolizers.\n\nBeyond blocking adenosine receptors, caffeine also interferes with melatonin production, the hormone that signals to your body it's time to sleep. Studies have shown that caffeine consumed 3 hours before bedtime can delay the body's internal clock by approximately 40 minutes. This phase delay means your body's natural sleep signals are pushed later, creating a cycle where you feel awake at night but tired in the morning.",
        references: [
          "Sleep Medicine Reviews - Meta-Analysis of Caffeine and Sleep",
          "Science Translational Medicine - Caffeine and Circadian Rhythm",
          "Oxford Academic SLEEP Journal - Caffeine Timing Studies",
        ],
      },
      {
        id: "slp-2",
        title: "Strategic Caffeine Timing for Peak Performance",
        summary: "Research-backed approaches to maximize alertness while protecting sleep.",
        image: "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=100&h=100&fit=crop",
        content: "Scientists have developed sophisticated models for optimizing caffeine consumption to maximize alertness during waking hours while minimizing sleep disruption. Recent research combining sleep scheduling with caffeine timing has shown that strategic consumption can reduce alertness impairment by over 60 percent compared to unplanned intake. This represents a significant improvement in cognitive performance for those who need to stay sharp during demanding schedules.\n\nThe key insight from this research is that both when you sleep and when you consume caffeine need to be coordinated for optimal results. Simply optimizing one without the other provides limited benefits. For shift workers, travelers dealing with jet lag, or anyone facing irregular schedules, this integrated approach offers practical guidance for maintaining performance while protecting sleep quality.\n\nOne effective strategy is to consume caffeine 30 to 60 minutes after waking rather than immediately upon rising. This timing allows your body's natural cortisol awakening response to work first, then supplements it with caffeine when cortisol levels begin declining. This approach can provide more sustained energy throughout the morning without requiring higher doses.\n\nFor those who need afternoon alertness, a small caffeine dose of 50 to 100 milligrams consumed before 2 PM can provide a boost without significantly impacting nighttime sleep for most people. Some research supports the caffeine nap strategy, where you consume caffeine immediately before a 20-minute nap. The caffeine takes about 20 minutes to kick in, so you wake just as the alerting effects begin, feeling doubly refreshed.",
        references: [
          "SLEEP Journal - Optimizing Caffeine and Sleep Schedules (2024)",
          "Journal of Clinical Sleep Medicine - Caffeine Timing Strategies",
          "Chronobiology International - Circadian Optimization Research",
        ],
      },
      {
        id: "slp-3",
        title: "Natural Alternatives for Sustained Energy",
        summary: "Evidence-based ways to boost alertness without relying on caffeine.",
        image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=100&h=100&fit=crop",
        content: "While caffeine is effective for boosting alertness, relying on it too heavily can create dependency and disrupt natural energy regulation. Fortunately, research has identified several evidence-based alternatives that can provide sustained energy without the potential downsides of excessive caffeine consumption. Understanding these options allows for a more balanced approach to managing energy levels throughout the day.\n\nPhysical activity is one of the most powerful natural energy boosters. Even a brief 10-minute walk can increase alertness and improve mood for up to 2 hours afterward. Exercise increases blood flow to the brain, releases endorphins, and can be more effective than caffeine for combating afternoon fatigue. Regular exercise also improves sleep quality, creating a positive cycle of better rest and more natural daytime energy.\n\nHydration plays a surprisingly significant role in energy levels. Even mild dehydration of 1 to 2 percent of body weight can cause fatigue, difficulty concentrating, and reduced alertness. Many people mistake thirst for tiredness and reach for caffeine when water would be more helpful. Keeping a water bottle nearby and drinking consistently throughout the day can prevent these energy dips.\n\nExposure to natural light, particularly in the morning, helps regulate circadian rhythms and promotes daytime alertness. Light exposure suppresses melatonin production and signals to your body that it's time to be awake. Strategic napping, limited to 20 to 30 minutes before 3 PM, can restore alertness without interfering with nighttime sleep. Balanced meals that combine protein, complex carbohydrates, and healthy fats provide steady energy without the blood sugar spikes and crashes associated with sugary snacks and drinks.",
        references: [
          "International Journal of Behavioral Nutrition - Exercise and Energy",
          "European Journal of Clinical Nutrition - Hydration and Cognition",
          "Journal of Sleep Research - Light Exposure and Alertness",
        ],
      },
    ],
  },
  {
    title: "Healthy Consumption Tips",
    articles: [
      {
        id: "tip-1",
        title: "Building a Balanced Caffeine Routine",
        summary: "Practical strategies for enjoying caffeine while maintaining overall wellness.",
        image: "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=100&h=100&fit=crop",
        content: "Creating a sustainable caffeine routine involves more than just counting milligrams. A thoughtful approach considers timing, sources, and individual responses to optimize benefits while avoiding potential drawbacks. The goal is to use caffeine as a tool for enhanced performance and enjoyment rather than a crutch for getting through the day.\n\nStart by tracking your current consumption for a week, including all sources: coffee, tea, soft drinks, energy drinks, chocolate, and any medications containing caffeine. Many people are surprised to discover they consume significantly more than they realized. This baseline helps identify opportunities for adjustment if needed. Pay attention to how different amounts and timings affect your energy, mood, and sleep.\n\nConsider the quality of your caffeine sources. Coffee and tea offer additional health benefits from antioxidants and other plant compounds that energy drinks and soft drinks lack. If you drink multiple cups of coffee daily, try making your second or third cup a half-caf blend to reduce total intake while maintaining the ritual you enjoy. Green tea provides a gentler caffeine boost with L-theanine, an amino acid that promotes calm focus.\n\nBuild in caffeine-free days or periods to prevent tolerance from building up. Some people benefit from one caffeine-free day per week, while others do well with periodic week-long breaks. These breaks help reset your adenosine receptors so caffeine remains effective at lower doses. If you experience withdrawal symptoms during breaks, this indicates some level of dependence and suggests gradually reducing your baseline intake.",
        references: [
          "Harvard School of Public Health - Healthy Caffeine Consumption",
          "American Dietetic Association - Caffeine Guidelines",
          "National Sleep Foundation - Caffeine and Daily Routines",
        ],
      },
      {
        id: "tip-2",
        title: "Recognizing When to Cut Back on Caffeine",
        summary: "Signs that your caffeine intake may be affecting your health negatively.",
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=100&h=100&fit=crop",
        content: "While moderate caffeine consumption is safe for most adults, there are clear signals that indicate it may be time to reduce intake. Recognizing these signs early can prevent more significant health issues and help restore a healthier relationship with caffeine. Your body provides valuable feedback if you learn to listen to it.\n\nSleep problems are often the first warning sign of excessive caffeine consumption. If you consistently have trouble falling asleep, wake frequently during the night, or feel unrested despite adequate sleep duration, caffeine may be a contributing factor. Keep a sleep diary noting both your caffeine intake and sleep quality to identify patterns. Even if you feel you fall asleep fine, caffeine could be reducing your deep sleep stages.\n\nAnxiety, restlessness, and jitteriness are direct effects of caffeine overstimulation. If you notice your heart racing, hands trembling, or feeling on edge, these symptoms suggest your caffeine intake exceeds your tolerance. Some people experience digestive issues like acid reflux, stomach upset, or frequent urination as caffeine stimulates these systems.\n\nDependence is indicated by needing caffeine just to feel normal or function at baseline levels. If your first thought upon waking is about getting coffee, if you experience headaches or irritability when caffeine is delayed, or if you've gradually increased your intake over time to achieve the same effects, these patterns suggest problematic use. Cutting back gradually rather than abruptly can help minimize withdrawal symptoms while restoring sensitivity to lower doses.",
        references: [
          "Mayo Clinic - Signs of Caffeine Overconsumption",
          "Cleveland Clinic - When to Reduce Caffeine",
          "Journal of Caffeine Research - Dependence Indicators",
        ],
      },
      {
        id: "tip-3",
        title: "Caffeine Considerations for Special Populations",
        summary: "Tailored guidance for pregnant women, athletes, and those with health conditions.",
        image: "https://images.unsplash.com/photo-1493894473891-10fc1e5dbd22?w=100&h=100&fit=crop",
        content: "Different life circumstances and health conditions require modified approaches to caffeine consumption. What works well for one person may not be appropriate for another. Understanding these nuances helps ensure caffeine remains a positive part of life without creating unnecessary risks.\n\nPregnant women should limit caffeine to under 200 milligrams daily, approximately one 12-ounce cup of coffee. Caffeine crosses the placenta, and because the developing fetus cannot metabolize it efficiently, exposure lasts longer and can affect growth. Research has linked higher caffeine intake during pregnancy to increased risks of low birth weight and preterm delivery. Many women choose to further reduce or eliminate caffeine during pregnancy out of caution.\n\nAthletes can benefit from strategic caffeine use for performance enhancement, with research supporting doses of 3 to 6 milligrams per kilogram of body weight taken 30 to 60 minutes before exercise. However, regular high intake can diminish these performance benefits through tolerance. Some athletes periodically reduce caffeine to resensitize before important competitions. Caffeine also acts as a diuretic, so adequate hydration during exercise is especially important.\n\nPeople with anxiety disorders may find that caffeine worsens symptoms, as it activates the same fight-or-flight response that underlies anxiety. Those with heart arrhythmias, uncontrolled high blood pressure, or gastroesophageal reflux disease often benefit from significantly reducing or eliminating caffeine. Anyone taking medications should check for interactions, as caffeine can affect how certain drugs are metabolized, potentially increasing or decreasing their effectiveness.",
        references: [
          "American College of Obstetricians and Gynecologists - Caffeine During Pregnancy",
          "International Society of Sports Nutrition - Caffeine Position Stand",
          "Anxiety and Depression Association of America - Caffeine and Anxiety",
        ],
      },
    ],
  },
];

export default function HistoryScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();

  const handleArticlePress = (article: Article) => {
    navigation.navigate("Article", { article });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Information Hub</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{section.title}</Text>
            {section.articles.map((article) => (
              <Pressable
                key={article.id}
                style={[styles.articleCard, { backgroundColor: theme.backgroundDefault }]}
                onPress={() => handleArticlePress(article)}
              >
                <Image source={{ uri: article.image }} style={styles.articleImage} />
                <View style={styles.articleContent}>
                  <Text style={[styles.articleTitle, { color: theme.text }]} numberOfLines={2}>
                    {article.title}
                  </Text>
                  <Text style={[styles.articleSummary, { color: theme.mutedGrey }]} numberOfLines={2}>
                    {article.summary}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing["3xl"],
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  articleCard: {
    flexDirection: "row",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  articleImage: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.sm,
  },
  articleContent: {
    flex: 1,
    marginLeft: Spacing.md,
    justifyContent: "center",
  },
  articleTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 2,
    lineHeight: 16,
  },
  articleSummary: {
    fontSize: 11,
    lineHeight: 14,
  },
});
