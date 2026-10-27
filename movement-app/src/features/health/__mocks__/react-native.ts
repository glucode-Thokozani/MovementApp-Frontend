export const Platform = {
  OS: 'ios' as 'ios' | 'android' | 'web' | 'windows' | 'macos',
  select: <T>(obj: { ios?: T; android?: T; default?: T }): T | undefined =>
    obj.ios ?? obj.default,
};
