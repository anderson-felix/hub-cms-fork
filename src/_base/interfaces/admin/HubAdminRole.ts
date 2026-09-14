export const hubAdminRoles = <const>['content_manager', 'admin', 'owner'];

export type HubAdminRole = (typeof hubAdminRoles)[number];
