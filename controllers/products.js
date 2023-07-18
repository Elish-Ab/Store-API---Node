const { query } = require('express')
const Product = require('../models/product')

const getAllProductsStatic = async(req, res) => {
    const products = await Product.find({ price: { $gt: 30 } })
        .sort('price')
        .select('name price')
        // .limit(10)
    res.status(200).json({ products, nbHits: products.length })
}

const getAllProducts = async(req, res) => {
    const { featured, company, name, sort, fields, numberFilters } = req.query
    const queryObject = {}

    if (featured) {
        queryObject.featured = featured === 'true' ? true : false
    }

    if (company) {
        queryObject.company = company
    }

    if (name) {
        queryObject.name = { $regex: name, $options: 'i' }
    }
    if (numberFilters) {
        const operatorMap = {
            '>': '$gt',
            '>=': '$gte',
            '=': '$eq',
            '<': '$lt',
            '<=': '$lte',

        }
        const regEx = /\b(<|>|>=|=|<=)\b/g;
        let filters = numberFilters.replace(regEx, (match) => `-${operatorMap[match]}-`)
        const options = ['price', 'rating'];
        filters = filters.split(',').forEach((item) => {
            const [field, operator, value] = item.split('-')
            if (options.includes(field)) {
                queryObject[field] = {
                    [operator]: Number(value)
                }
            }
        })
    }
    console.log(queryObject)
    let result = Product.find(queryObject)
        //sort
    if (sort) {
        const sortList = sort.split(',').join(' ')
        result = result.sort(sortList)
            // products = products.sort()
    } else {
        result = result.sort('crateAt')
    }
    if (fields) {
        const fieldsList = fields.split(',').join(' ')
        result = result.select(fieldsList)
    }
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit
        /* start at the value and show me number of limited items. for Example if i want to see 
           3(page 3, it passes three items) items from 3 to 5, simply i select my page 2 then (2-1)*3 = an item in position three and two other items will appear */

    result = result.skip(skip).limit(limit)

    const products = await result;
    res.status(200).json({ products, nbHits: products.length })

}

module.exports = {
    getAllProductsStatic,
    getAllProducts
}