module.exports.categoryList = async function categoryList(ctx, next) {
    const categories = await Category.find({});
    ctx.body = {categories: categories};
    return next();
};
