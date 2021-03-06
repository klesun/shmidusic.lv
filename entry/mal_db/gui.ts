
import {Dom} from "../../src/utils/Dom";

export let ShowMalGui = function(root: HTMLElement)
{
    let filters = Dom.get(root).input('.useful-list .filters')[0];
    return {
        betterList: {
            filters: {
                notInListOf: () => Dom.get(filters).input('.not-in-list-of')[0].value,
                sortBy: () => Dom.get(filters).select('.sort-by')[0].value,
                minPersonal: () => +Dom.get(filters).input('.min-personal')[0].value,
                minMembers: () => +Dom.get(filters).input('.min-members')[0].value,
                maxOverrate: () => +Dom.get(filters).input('.max-overrate')[0].value,
                formats: () => Dom.get(filters).input('.useful-list .filters .format input[type="checkbox"]:checked')
                    .map(f => f.getAttribute('data-name')),
                limit: () => +Dom.get(filters).input('.limit')[0].value,
                set submit(cb: () => void) {
                    Dom.get(filters).button('.reorder')[0].onclick = cb;
                },
            },
        },
    };
};
