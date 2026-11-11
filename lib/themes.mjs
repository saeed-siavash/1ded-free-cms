// Theme IDs are permanent: published content never depends on presentation.
export const themeCatalog = [
  {id:'minimal',name:'Minimal',description:'Quiet confidence. Room to breathe.',accent:'#486548',font:'sans',headline:'Good ideas.\nGreat things.',bestFor:'Personal & studio'},
  {id:'corporate',name:'Corporate',description:'Clear, structured, ready for business.',accent:'#2457a6',font:'sans',headline:'Built on trust.\nMade for growth.',bestFor:'Business & services'},
  {id:'graphic',name:'Graphic',description:'Bold ideas deserve a bold canvas.',accent:'#a83e2d',font:'sans',headline:'Think bigger.\nMake a mark.',bestFor:'Creative portfolios'},
  {id:'maximal',name:'Maximal',description:'Texture, character, and a playful spirit.',accent:'#784097',font:'serif',headline:'A little more\nextraordinary.',bestFor:'Artists & storytellers'},
  {id:'coast',name:'Coast',description:'Fresh sea blues, airy space, and soft geometry.',accent:'#176987',font:'sans',headline:'A fresh outlook.\nAn open horizon.',bestFor:'Consultants & companies'},
  {id:'bloom',name:'Bloom',description:'Warm coral, blush tones, and a friendly human touch.',accent:'#ab3d50',font:'sans',headline:'Good people.\nBeautiful possibilities.',bestFor:'Personal brands & wellness'},
  {id:'citrus',name:'Citrus',description:'Sunlit yellow, leafy green, and lively simple shapes.',accent:'#41642b',font:'sans',headline:'Bright thinking.\nFresh beginnings.',bestFor:'Local businesses & makers'},
  {id:'lavender',name:'Lavender',description:'Soft violet, editorial type, and a considered rhythm.',accent:'#69519c',font:'serif',headline:'Stories worth\nsharing.',bestFor:'Biographies & authors'}
];
export const findTheme = id => themeCatalog.find(theme=>theme.id===id);
