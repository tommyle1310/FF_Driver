export const data_horizontal_scrollable_list_Card: {
  name: 'MOMO' | 'VCB' | 'OTHERS';
  avatar: string;
  onPress: (callback?: () => void) => void;  // onPress accepts an optional callback
  serviceFee: number;
}[] = [
  {
    avatar: 'https://res.cloudinary.com/dlavqnrlx/image/upload/v1737543941/fewen7qbecekbp1pa1id.webp',
    name: 'MOMO',
    onPress: () => {}, // No callback for MOMO
    serviceFee: 0,
  },
  {
    avatar: 'https://res.cloudinary.com/dlavqnrlx/image/upload/v1737542220/qqjdv2jdjlzsaowuxsll.webp',
    name: 'VCB',
    onPress: (callback?: () => void) => { 
      if (callback) {
        callback(); 
      }
    },  // `onPress` accepts an optional callback
    serviceFee: 0,
  },
  {
    avatar: 'https://cdn-icons-png.flaticon.com/128/16993/16993968.png',
    name: 'OTHERS',
    onPress: (callback?: () => void) => { 
      if (callback) {
        callback(); 
      }
    },  // `onPress` accepts an optional callback
    serviceFee: 0,
  },
];
