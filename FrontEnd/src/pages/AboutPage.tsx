import { CustomerLayout } from '@/layouts';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, Clock, Heart, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const AboutPage = () => {
  const { t } = useTranslation();
  const chefs = [
    {
      id: 1,
      name: 'Alessandro Romano',
      role: t('chefs.headChef'),
      specialty: t('chefs.alessandro.specialty'),
      image: 'https://images.unsplash.com/photo-1583394293214-28ded15ee548?w=400&h=400&fit=crop',
      experience: t('chefs.alessandro.experience'),
      description: t('chefs.alessandro.description'),
    },
    {
      id: 2,
      name: 'Maria Esposito',
      role: t('chefs.pastryChef'),
      specialty: t('chefs.maria.specialty'),
      image: 'https://images.unsplash.com/photo-1595273670150-bd0c3c392e46?w=400&h=400&fit=crop',
      experience: t('chefs.maria.experience'),
      description: t('chefs.maria.description'),
    },
    {
      id: 3,
      name: 'Giovanni Bianchi',
      role: t('chefs.sousChef'),
      specialty: t('chefs.giovanni.specialty'),
      image: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&h=400&fit=crop',
      experience: t('chefs.giovanni.experience'),
      description: t('chefs.giovanni.description'),
    },
    {
      id: 4,
      name: 'Sofia Marino',
      role: t('chefs.seafoodSpecialist'),
      specialty: t('chefs.sofia.specialty'),
      image: 'https://images.unsplash.com/photo-1559548331-f9cb98001426?w=400&h=400&fit=crop',
      experience: t('chefs.sofia.experience'),
      description: t('chefs.sofia.description'),
    },
  ];

  const stats = [
    { icon: Clock, label: t('stats.yearsOfExcellence'), value: '25+' },
    { icon: Users, label: t('stats.happyCustomers'), value: '50,000+' },
    { icon: Award, label: t('stats.awardsWon'), value: '15' },
    { icon: Heart, label: t('stats.signatureDishes'), value: '100+' },
  ];

  return (
    <CustomerLayout>
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative h-[400px] overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&h=400&fit=crop)',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/50" />
          </div>
          <div className="relative container h-full flex items-center">
            <div className="max-w-2xl text-white">
              <h1 className="font-display text-5xl md:text-6xl font-bold mb-4">
                {t('about.title')}
              </h1>
              <p className="text-xl text-white/90">
                {t('about.subtitle')}
              </p>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 bg-muted/30">
          <div className="container">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                    <stat.icon className="w-8 h-8 text-primary" />
                  </div>
                  <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Story */}
        <section className="py-16">
          <div className="container">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="font-display text-4xl font-bold mb-6">{t('about.ourStory')}</h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    {t('about.storyText1')}
                  </p>
                  <p>
                    {t('about.storyText2')}
                  </p>
                  <p>
                    {t('about.storyText3')}
                  </p>
                </div>
              </div>
              <div className="relative h-[500px] rounded-lg overflow-hidden shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=1000&fit=crop"
                  alt="Restaurant Interior"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Our Values */}
        <section className="py-16 bg-muted/30">
          <div className="container">
            <h2 className="font-display text-4xl font-bold text-center mb-12">{t('about.ourValues')}</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="text-center">
                <CardContent className="pt-8 pb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                    <Heart className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{t('about.passion')}</h3>
                  <p className="text-muted-foreground">
                    {t('about.passionDesc')}
                  </p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="pt-8 pb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                    <Award className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{t('about.quality')}</h3>
                  <p className="text-muted-foreground">
                    {t('about.qualityDesc')}
                  </p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="pt-8 pb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{t('about.community')}</h3>
                  <p className="text-muted-foreground">
                    {t('about.communityDesc')}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Meet Our Chefs */}
        <section className="py-16">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="font-display text-4xl font-bold mb-4">{t('about.meetOurTeam')}</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {t('about.teamSubtitle')}
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {chefs.map((chef) => (
                <Card key={chef.id} className="overflow-hidden group hover:shadow-xl transition-all duration-300">
                  <div className="relative h-64 overflow-hidden">
                    <img 
                      src={chef.image}
                      alt={chef.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <h3 className="text-xl font-bold mb-1">{chef.name}</h3>
                      <p className="text-sm text-white/90">{chef.role}</p>
                    </div>
                  </div>
                  <CardContent className="pt-6 pb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary" className="text-xs">
                        {chef.specialty}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{chef.experience}</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {chef.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-16 bg-gradient-gold">
          <div className="container text-center">
            <h2 className="font-display text-4xl font-bold text-white mb-4">
              {t('about.experience')}
            </h2>
            <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
              {t('about.experienceDesc')}
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <a href="/reservations">
                <button className="px-8 py-3 bg-white text-primary font-semibold rounded-lg hover:bg-white/90 transition-colors">
                  {t('about.makeReservation')}
                </button>
              </a>
              <a href="/menu">
                <button className="px-8 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors">
                  {t('about.viewMenu')}
                </button>
              </a>
            </div>
          </div>
        </section>
      </div>
    </CustomerLayout>
  );
};

export default AboutPage;
