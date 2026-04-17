export const CATEGORY_GROUPS = [
  {
    id: 'froid',
    name: 'FROID & CONSERVATION',
    description: 'Gardez vos aliments et boissons toujours frais',
    icon: '',
    categories: [
      { id: 'refrigerateurs', name: 'Réfrigérateurs' },
      { id: 'congelateurs', name: 'Congélateurs' },
      { id: 'vitrines', name: 'Vitrines réfrigérées' },
    ]
  },
  {
    id: 'cuisson',
    name: 'CUISSON & CUISINE',
    description: 'Équipez votre cuisine efficacement',
    icon: '',
    categories: [
      { id: 'gazinieres', name: 'Gazinières / Cuisinières' },
      { id: 'fours', name: 'Fours' },
      { id: 'micro-ondes', name: 'Micro-ondes' },
      { id: 'plaques', name: 'Plaques de cuisson' },
      { id: 'cuiseurs', name: 'Friteuses / Rice cookers' },
    ]
  },
  {
    id: 'petit-electro',
    name: 'PETIT ÉLECTROMÉNAGER',
    description: 'Les indispensables du quotidien',
    icon: '',
    categories: [
      { id: 'mixeurs', name: 'Mixeurs / Blenders' },
      { id: 'bouilloires', name: 'Bouilloires' },
      { id: 'cafetieres', name: 'Cafetières' },
      { id: 'fers', name: 'Fers à repasser' },
    ]
  },
  {
    id: 'lavage',
    name: 'LAVAGE & ENTRETIEN',
    description: 'Simplifiez vos tâches ménagères',
    icon: '',
    categories: [
      { id: 'machines-laver', name: 'Machines à laver' },
      { id: 'aspirateurs', name: 'Aspirateurs' },
      { id: 'nettoyeurs', name: 'Nettoyeurs' },
    ]
  },
  {
    id: 'climatisation',
    name: 'CLIMATISATION & CONFORT',
    description: 'Restez au frais et à l’aise',
    icon: '',
    categories: [
      { id: 'climatiseurs', name: 'Climatiseurs' },
      { id: 'ventilateurs', name: 'Ventilateurs' },
    ]
  },
  {
    id: 'hightech',
    name: 'HIGH-TECH & BUREAUTIQUE',
    description: 'Travail, études et divertissement',
    icon: '',
    categories: [
      { id: 'televisions', name: 'Télévisions' },
      { id: 'smartphones', name: 'Smartphones (iPhone & Android)' },
      { id: 'tablettes', name: 'Tablettes' },
      { id: 'ordinateurs', name: 'Ordinateurs' },
      { id: 'imprimantes', name: 'Imprimantes' },
    ]
  },
  {
    id: 'salon',
    name: 'SALON & SÉJOUR',
    description: 'Confort et accueil',
    icon: '',
    categories: [
      { id: 'canapes', name: 'Canapés' },
      { id: 'fauteuils', name: 'Fauteuils' },
      { id: 'tables-basses', name: 'Tables basses' },
      { id: 'meubles-tv', name: 'Meubles TV' },
    ]
  },
  {
    id: 'chambre',
    name: 'CHAMBRE',
    description: 'Repos et organisation',
    icon: '',
    categories: [
      { id: 'lits', name: 'Lits' },
      { id: 'matelas', name: 'Matelas' },
      { id: 'armoires', name: 'Armoires' },
      { id: 'commodes', name: 'Commodes' },
    ]
  },
  {
    id: 'salle-a-manger',
    name: 'SALLE À MANGER',
    description: 'Moments en famille',
    icon: '',
    categories: [
      { id: 'tables-manger', name: 'Tables à manger' },
      { id: 'chaises', name: 'Chaises' },
      { id: 'buffets', name: 'Buffets' },
    ]
  },
  {
    id: 'bureau',
    name: 'BUREAU & TRAVAIL',
    description: 'Productivité',
    icon: '',
    categories: [
      { id: 'bureaux', name: 'Bureaux' },
      { id: 'chaises-bureau', name: 'Chaises de bureau' },
      { id: 'rangements-bureau', name: 'Rangements' },
    ]
  },
  {
    id: 'rangement',
    name: 'RANGEMENT & ORGANISATION',
    description: 'Optimisez vos espaces',
    icon: '',
    categories: [
      { id: 'placards', name: 'Placards' },
      { id: 'etageres', name: 'Étagères' },
      { id: 'meubles-multi', name: 'Meubles multifonctions' },
    ]
  }
];

export const ALL_CATEGORIES = CATEGORY_GROUPS.flatMap(group => group.categories);

export const getCategoryName = (id: string) => {
  return ALL_CATEGORIES.find(cat => cat.id === id)?.name || id;
};
