// Fixed, locally shipped subject artwork; no model-controlled paths.
const profiles = {
  planning: ['digital-topic-planning',3,'#536A7A','#E8EEF2','sans'], money: ['digital-topic-finance',2,'#287154','#E4EFE8','sans'],
  cooking: ['digital-cooking',7,'#A95632','#F2E6D8','serif'], wellness: ['digital-wellness',4,'#59705D','#E8EDE1','serif'],
  lifestyle: ['digital-topic-lifestyle',6,'#AC6477','#F3E5E9','serif'], business: ['digital-business',8,'#365D80','#E4EAF1','sans'],
  marketing: ['digital-topic-marketing',9,'#7848A4','#EEE5F5','display'], career: ['digital-business',3,'#446384','#E3ECF2','sans'],
  wedding: ['digital-wedding',6,'#A85F79','#F5E6EC','serif'], events: ['digital-events',9,'#AD6325','#FAECD9','display'],
  family: ['digital-parenting',4,'#B96047','#F8E9DF','sans'], education: ['digital-topic-education',3,'#416F98','#E3EEF8','sans'],
  tutorials: ['digital-topic-tutorials',8,'#436E7C','#E4EFF1','sans'], travel: ['digital-travel',10,'#277C83','#DCF0EE','display'],
  home: ['digital-home-guides',7,'#8A6D4E','#F2EBE0','serif'], property: ['digital-real-estate',8,'#506752','#E4EBE2','sans'],
  faith: ['digital-topic-faith',6,'#876B9E','#EDE6F1','serif'], pets: ['pet-goods',4,'#A36738','#F3E9DC','sans'],
  crafts: ['digital-crafts',7,'#A55D47','#F2E2D9','serif'], 'printable-art': ['art-supplies',9,'#7D5B9C','#EDE4F3','display'],
  spreadsheets: ['digital-topic-finance',2,'#286758','#E0EEE6','mono'], 'notion-systems': ['digital-topic-planning',3,'#546171','#E8ECF0','sans'],
  'editable-templates': ['digital-topic-marketing',9,'#945783','#F3E5F0','display'], 'media-assets': ['digital-photography',5,'#4D6782','#E4EAF2','sans'],
  tech: ['digital-topic-tech',8,'#4264A2','#E4EBFA','mono'],
};
export const topicStyles = Object.freeze(Object.fromEntries(Object.entries(profiles).map(([id,[asset,variant,accent,soft,heading]])=>[id,Object.freeze({asset:`${asset}-hero.webp`,variant:String(variant).padStart(2,'0'),palette:{paper:'#FFFCF7',ink:'#24252B',muted:'#5D5D64',accent,soft},fonts:{heading,body:'sans'}})])));
